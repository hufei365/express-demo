/*
 * @author:				tomasran
 * @createDate:			2016-04-12 11:40:32
 * @lastModifiedBy:		tomasran
 * @description:		基础菜单组件
 */

/*
 *	@expamle:
 *		var menu = new Menu({
 *			'container': '',						//	the outside container, jquery object or string
 *			'menuClass': '',						//	the class of inside menu
 *			'defaultSelected': {},					//	default selected
 *			'onlyOneExpansion': true,				//	only one list expanded at any time
 *			'selectedFunc': function() {},			//	callback when select one of the items
 *			'list':[{								//	item data
 *				'id': '',
 *				'name': '',
 *				'content': '',
 *				'list': []
 *			}, {
 *				'id': '',
 *				'name': '',
 *				'content': '',
 *				'list': []
 *			}],
 *			'levelConfig': {						// configuration of each level(child inherits its parent)
 *				'1': {								// '1' represents the first level of the menu, and '2' for second level...
 *					'listClass': '',				// class of list
 *					'wrapClass': '',				// class of wrap element
 *					'itemClass': '',				// class of item
 *					'expandClass': '',				// class of expand
 *					'hoverClass': '',				// class of hover
 *					'selectedClass': '',			// class of item which is selected
 *					'selectEvent': '',				// the event triggering selected of one item
 *					'isSelectedExpand': '',			// whether expand when selected
 *					'childExpandEvent': '',			// the event triggering expanded of item's sublist
 *					'childFoldEvent': '',			// the event triggering fold of item's sublist
 *					'position': '',					// the position relative to its parent
 *					'hideAfterSelected': '',		// whether disappeared when the item is selected
 *				},
 *				'2': {
 *				},
 *				...
 *			}
 *		});
 */

/* =========================================================================================================================== */

var $ = require('/components/common/base/base.js');
var uiClass = require('/components/common/class/class.js');


var isEmpty = function(data) {
	if (data === undefined || data === null) {
		return true;
	}

	return false;
};

/*
 *	create a jquery object through given tag
 *	@param	{string}	tagName
 *	@return	{object}	jquery object
 */
var createElement = function(tagName) {
	return $('<' + tagName + '>');
};

/*
 *	return boolean through a string
 *	@param	{string}	str
 *	@return	{boolean}
 */
var getBoolean = function(str) {
	return {
		'true': true,
		'false': false
	}[str];
};

/*
 *	get the level of given list	recursively
 *	@param	{array}	list
 *	@return	{int}	the level of the list
 */
var getListLevel = function(list) {
	var maxLevel = 1;
	var repeateCount = -1;

	for (var i = 0; i < list.length; i++) {
		if (list[i].list) {
			repeateCount++;
			maxLevel = maxLevel + getListLevel(list[i].list);
		}
	}

	return maxLevel - Math.max(0, repeateCount);
};


var Menu = uiClass().extend({
	START_LEVEL: 1,
	LEVEL_STEP: 1,
	DEFUALT_HIDE_AFTER_SELECTED_TIME: 50,
	DEFAULT_MENU_CLASS: 'menu',
	LIST_TAG: 'dl',
	WRAP_TAG: 'dt',
	ITEM_TAG: 'a',

	DEFAULT_LEVEL_CONFIG: {
		'position': 'bottom',
		'childExpansion': true,
		'childExpandEvent': 'click',
		'childFoldEvent': 'click',
		'selectEvent': 'click',
		'selectedClass': 'selected',
		'hideAfterSelected': false,
		'isSelectedExpand': false,
		'hoverClass': 'hover',
		'listClass': 'list',
		'wrapClass': 'wrap',
		'itemClass': 'item',
		'hoverItem': '',
		'expandItem': '',
		'selectItem': ''
	},

	POSITION_SELECTOR: {
		'top': {
			'position':'absolute',
			'left': 0,
			'bottom': '100%'
		},
		'bottom': {
			'position':'relative',
			'left': 0,
			'top': 0
		},
		'right': {
			'position':'absolute',
			'left': '100%',
			'top': 0
		},
		'left': {
			'position':'absolute',
			'right': '100%',
			'top': 0
		}
	},

	init: function(opts) {
		this.checkOpts(opts);

		/* the data of current selected item */
		this.currentSelected = this.defaultSelected;

		this.menu = this.menu || createElement('menu').attr({
			'class': this.menuClass || this.DEFAULT_MENU_CLASS
		}).appendTo(this.container);

		var menuContent = this.constructMenu(this.list, this.START_LEVEL);

		if (menuContent) {
			menuContent.appendTo(this.menu);
			this.select(this.defaultSelected);
		}
	},

	/* validate & prehandle data */
	checkOpts: function(opts) {
		this.opts = $.extend({
			'container': 'body',
			'extraData': undefined,
			'menuClass': this.DEFAULT_MENU_CLASS,
			'defaultSelected': {},
			'onlyOneExpansion': true,
			'selectedFunc': function() {},
			'list': [],
			'levelConfig': {}
		}, opts);

		for (var prop in this.opts) {
			if (this.opts.hasOwnProperty(prop)) {
				this[prop] = this.opts[prop];
			}
		}

		this.container = this.getContainer(this.container);
		this.totalLevel = this.getDeepestLevel(this.list);
		this.levelConfig = this.getLevelConfig(this.levelConfig);
	},

	/*
	 *	get items by the value of data-xxx
	 *	@param	{object}	opts
	 *	@param	{string or object}	selector
	 *	@return {arrayLike}	jquery selectors
	 */
	getItems: function(opts, selector) {
		if (typeof opts !== 'object') {
			return [];
		}

		var ancestor = this.menu;
		var filterStr = '';

		for (var prop in opts) {
			if (opts.hasOwnProperty(prop)) {
				if (opts[prop]) {
					filterStr += '[data-' + prop + '=' + opts[prop] + ']';
				}
			}
		}

		if (selector) {
			ancestor = typeof selector === 'string' ? $(selector, ancestor) : selector;
		}

		return ancestor.find(filterStr);
	},

	/*
	 *	get menu's deepest level
	 *	@param	{array}	list
	 *	@return	{int}	the value of deepest level
	 */
	getDeepestLevel: function(list) {
		if (!list) {
			return 0;
		}

		var startLevel = 1;
		var childrenLevel = 0;

		for (var i = 0; i < list.length; i++) {
			if (list[i].list) {
				childrenLevel = Math.max(childrenLevel, getListLevel(list[i].list));
			}
		}

		return startLevel + childrenLevel;
	},

	/*
	 *	complete and return levelConfig
	 *	submenu will inherit the setting of previous menu
	 *	levelConfig[0] is default config
	 *	@param {object}	options' levelConfig
	 *	@return	{object}	levelConfig
	 */
	getLevelConfig: function(levelConfig) {
		var result = {};

		for (var i = 0; i <= this.totalLevel; i++) {
			result[i] = $.extend({}, result[i-1] || this.DEFAULT_LEVEL_CONFIG, levelConfig[i]);
		}

		return result;
	},

	/*
	 *	get outside container
	 *	@param {object} or {string}
	 *	@return {object} jquery object
	 */
	getContainer: function(container) {
		if (typeof container === 'object') {
			return container;
		} else {
			if ($(container).length === 0) {
				return null;
			} else {
				return $(container);
			}
		}
	},

	/*
	 * whether has sublist
	 */
	hasSubList: function(target) {
		if (target.siblings(this.LIST_TAG).length === 0) {
			return true;
		} else {
			return false;
		}
	},

	// get the data of selected menu item
	getSelectedItemData: function(item) {
		var data = [];
		var parentLists = item.parents(this.LIST_TAG);

		Array.prototype.pop.call(parentLists);

		var ceil = this.getItemData(item[0]);

		ceil.isLastLevel = this.hasSubList(item);
		data.push(ceil);

		if (parentLists.length !== 0) {
			$.each(parentLists, function(i, list) {
				var c = this.getItemData($(list).siblings()[0]);

				c.lsLastLevel = this.hasSubList($(list).siblings());
				data.push(c);
			}.bind(this));
		}

		return data;
	},

	/*
	 * clear all selection
	 */
	clearSelection: function() {
		var lists = this.menu.find(this.LIST_TAG);

		$.each(lists, function(i, list) {
			var selectedClass = $(list).data('selectedClass');

			$(list).children().each(function() {
				var target = $(this).children(this.ITEM_TAG);

				target.removeClass(selectedClass);
			});
		});
	},

	/*
	 * recursive selection
	 */
	recurseSelection: function(option) {
		var targets =  this.getItems(option);

		if (targets.length === 0) {
			return null;
		}

		var list = $(targets[0]).parent().parent();
		var parentTarget = list.siblings(this.ITEM_TAG);
		var selectedClass = list.data('selectedClass');
		var hideAfterSelected = list.data('hideAfterSelected');
		var isSelectedExpand = list.data('isSelectedExpand');


		if (hideAfterSelected) {
			setTimeout(function() {
				list.addClass('none');
			}, this.SELECTED_DISAPPEARED_TIME);
		};

		if (isSelectedExpand) {
			list.removeClass('none');
		}

		$(targets[0]).addClass(selectedClass);

		if (parentTarget.length === 0) {
			return null;
		} else {
			return this.recurseSelection({
				'id': parentTarget.attr('data-id'),
				'level': parentTarget.attr('data-level')
			});
		}
	},

	/*
	 *	select one item of list
	 *	@param {object}	option
	 */
	select: function(option) {
		if (typeof option !== 'object') {
			return null;
		}

		var extraData = {
			'extraData': this.opts.extraData
		};

		if (isEmpty(option['id'])  && isEmpty(option['level'])) {
			return null;
		}

		var targets = this.getItems(option);

		if (targets.length === 0) {
			return null;
		}

		this.selectedData = this.getSelectedItemData($(targets[0]));

		this.lastSelected = this.currentSelected || {};
		this.currentSelected = this.selectedData[0];

		if (this.onlyOneExpansion && this.lastSelected.id) {
			if (this.lastSelected.id != this.currentSelected.id || this.lastSelected.level != this.currentSelected.level) {
				this.removeExpansion({
					'id': this.lastSelected.id,
					'level': this.lastSelected.level,
				});
			}
		}

		this.clearSelection();
		this.recurseSelection(option);
		this.selectedFunc.call(this, $.extend(this.currentSelected, extraData));
	},

	/*
	 *	remove expansion by given setting
	 *	@param {Object}	option
	 */
	removeExpansion: function(option) {
		if (!option || !option.id || !option.level) {
			this.menu.children().find(this.LIST_TAG).addClass('none');
		}

		var count = 0;
		var curTargets = this.getItems({
			'id': this.currentSelected.id,
			'level': this.currentSelected.level,
		});

		if (this.getItems(option, curTargets.siblings(this.LIST_TAG)).length) {
			return;
		}

		var targets = this.getItems(option);

		if (targets.length) {
			var startEl = targets.siblings(this.LIST_TAG).length ? targets.siblings(this.LIST_TAG) : targets;
			var list = startEl.closest(this.LIST_TAG);

			while(list[0] !== this.menu.children()[0] && count < 50 ) {
				if (!list[0]) {
					break;
				}

				var stop = this.getItems({
					'id': this.currentSelected.id,
					'level': this.currentSelected.level,
				}, list).length;

				if (stop) {
					break;
				} else {
					list.siblings(this.ITEM_TAG).removeClass(list.data('expandClass'));
					list.addClass('none');
					count++;
					list = list.siblings().closest(this.LIST_TAG);
				}
			}
		}
	},

	setItemData: function(item, data, exceptArr) {
		var exceptMap = {};

		$.each(exceptArr, function(i, ea) {
			exceptMap[ea] = true;
		});

		for (var prop in data) {
			if (data.hasOwnProperty(prop)) {
				if (!exceptMap[prop] && typeof data[prop] !== 'object') {
					item.attr('data-' + prop, data[prop]);
				}
			}
		}
	},

	getItemData: function (item) {
		var data = {};
		var attrs = item.attributes;
		var reg = new RegExp('^data-*');

		for(var prop in attrs) {
			if (attrs.hasOwnProperty(prop))	{
				if (reg.test(attrs[prop].name)) {
					var attr = attrs[prop].name.replace(reg, '');

					data[attr] = attrs[prop].value;
				}
			}
		}

		return data;
	},

	/*
	 *	construct menu recursively
	 *	@param {array}		list
	 *	@param {int}		level
	 *	@return {object}	menuList
	 */
	constructMenu: function(list, level) {
		var lvlConf = this.levelConfig[level];
		var parentLvlConf = this.levelConfig[level - 1];
		var menuList = this.constructMenuList(lvlConf, parentLvlConf);

		$.each(list, function(i, item) {
			var menuItem = this.constructMenuItem(item, level, lvlConf).appendTo(menuList);

			if (item.list) {
				menuItem.append(this.constructMenu(item.list, level + this.LEVEL_STEP));
			} else {
				menuItem.addClass('leaf');
			}
		}.bind(this));

		this.setMenuListPosition(lvlConf.position, menuList);
		this.bindHoverEvent(menuList, lvlConf.hoverClass, lvlConf.hoverItem);
		this.bindExpansionEvent(lvlConf, menuList);
		this.bindSelectionEvent(lvlConf, menuList);

		return menuList;
	},

	/*
	 *	construct each menu list
	 *	@param	{int}		levelConifg
	 *	@param	{int}		parentLevelConifg
	 *	@return {object}	menuList
	 */
	constructMenuList: function(levelConfig, parentLevelConfig) {
		var menuList = createElement(this.LIST_TAG).attr({
			'class': levelConfig.listClass
		})[getBoolean(parentLevelConfig.childExpansion) ? 'removeClass' : 'addClass']('none');

		menuList.data('selectedClass', levelConfig.selectedClass);
		menuList.data('expandClass', levelConfig.expandClass);
		menuList.data('hideAfterSelected', levelConfig.hideAfterSelected);
		menuList.data('isSelectedExpand', levelConfig.isSelectedExpand);

		return menuList;
	},

	/*
	 *	construct each item of menu list
	 *	@param	{object}	item		the data of item
	 *	@param	{int}		level		the level of item belongs to
	 *	@param	{object}	levelConfig
	 *	@return {object}	menuItem
	 */
	constructMenuItem: function(item, level, levelConfig) {
		var menuItem = createElement(this.WRAP_TAG).attr({
			'class': levelConfig.wrapClass
		}).css({
			'position': 'relative'
		});

		var menuItemContent = createElement(this.ITEM_TAG);

		menuItemContent.html(item.content).attr({
			'class': levelConfig.itemClass,
			'data-level': level
		}).appendTo(menuItem);

		this.setItemData(menuItemContent, item, ['list']);

		return menuItem;
	},

	/*
	 *	set the menu list's relative position
	 *	@param	{string}	position
	 *	@param	{object}	target
	 */
	setMenuListPosition: function(position, target) {
		target.css(this.POSITION_SELECTOR[position]);
	},

	/*
	 *	whether is the child of specific element
	 */
	isSelectorExist: function(bottomEle, topEle, selector) {
		var parentEle = $(bottomEle).parent();

		if (bottomEle === topEle || parentEle[0] === topEle) {
			return false;
		}

		if (parentEle.filter(selector).length) {
			return true;
		} else {
			this.isSelectorExist(selector, parentEle[0], topEle);
		}
	},

	/*
	 * whether the previous is a children of the later
	 * @param	{object}	childEle	dom object
	 * @param	{object}	parentEle	dom object
	 * @return	{boolean}
	 */
	isAncestor: function(childEle, parentEle) {
		var parents = $(childEle).parents();

		if (childEle === parentEle) {
			return true;
		}

		for (var i = 0; i < parents.length; i++) {
			if (parentEle === parents[i]) {
				return true;
			}
		}

		return false;
	},

	/*
	 *	bind menu expand event for each menu list
	 *	@param	{object}	levelConfig
	 *	@param	{object}	menuList
	 */
	bindExpansionEvent: function(levelConfig, menuList) {
		var self = this;
		var eItem = levelConfig.expandItem;
		var list = null;

		if (levelConfig.childExpandEvent === levelConfig.childFoldEvent) {
			menuList.children().on(levelConfig.childExpandEvent, function(e) {
				if (this !== e.target  && !self.isAncestor(e.target, $(this).children(self.ITEM_TAG)[0])) {
					return;
				}

				if (eItem) {
					if (($(e.target).filter(eItem).length || self.isSelectorExist(e.target, this, eItem))) {
						list = $(this).children(self.LIST_TAG);
						list.length && list.toggleClass('none');
						list.length && $(this).children(self.ITEM_TAG).toggleClass(list.data('expandClass') || '');
					}
				} else {
					list = $(this).children(self.LIST_TAG);
					list.length && list.toggleClass('none');
					list.length && $(this).children(self.ITEM_TAG).toggleClass(list.data('expandClass') || '');
				}
			});
		} else {
			menuList.children().on(levelConfig.childExpandEvent, function(e) {
				if (this !== e.target  && !self.isAncestor(e.target, $(this).children(self.ITEM_TAG)[0])) {
					return;
				}

				if (eItem) {
					if (($(e.target).filter(eItem).length || self.isSelectorExist(e.target, this, eItem))) {
						list = $(this).children(self.LIST_TAG);
						list.length && list.removeClass('none');
						list.length && $(this).children(self.ITEM_TAG).addClass(list.data('expandClass') || '');
					}
				} else {
					list = $(this).children(self.LIST_TAG);
					list.length && list.removeClass('none');
					list.length && $(this).children(self.ITEM_TAG).addClass(list.data('expandClass') || '');
				}
			});

			menuList.children().on(levelConfig.childFoldEvent, function(e) {
				/*if (this !== e.target  && !self.isAncestor(e.target, $(this).children(self.ITEM_TAG)[0])) {
					return;
				}*/

				if (eItem) {
					if (($(e.target).filter(eItem).length || self.isSelectorExist(e.target, this, eItem))) {
						list = $(this).children(self.LIST_TAG);
						list.length && list.addClass('none');
						list.length && $(this).children(self.ITEM_TAG).removeClass(list.data('expandClass') || '');
					}
				} else {
					list = $(this).children(self.LIST_TAG);
					list.length && list.addClass('none');
					list.length && $(this).children(self.ITEM_TAG).removeClass(list.data('expandClass') || '');
				}
			});
		}
	},

	/*
	 *	bind hover event
	 *	@param	{object}	list	each list
	 *	@param	{string}	hoverClass
	 *	@param	{string}	hoverItem	specific which tag will apply the hover class
	 */
	bindHoverEvent: function(list, hoverClass, hoverItem) {
		var self = this;

		list.children().on('mouseenter', function(e) {
			var selector = hoverItem ? $(this).children(self.ITEM_TAG).find(hoverItem) : $(this).children(self.ITEM_TAG);

			selector.addClass(hoverClass);
		}).on('mouseleave', function(e) {
			var selector = hoverItem ? $(this).children(self.ITEM_TAG).find(hoverItem) : $(this).children(self.ITEM_TAG);

			selector.removeClass(hoverClass);
		});
	},

	/*
	 *	bind select event
	 *	@param	{object}	levelConfig
	 *	@param	{object}	menuList
	 */
	bindSelectionEvent: function(levelConfig, menuList) {
		var self = this;
		var target = menuList.children().children().filter(self.ITEM_TAG);
		var selectItem = levelConfig.selectItem;

		target.on(levelConfig.selectEvent, function(e) {
			var data = self.getSelectedItemData($(this));

			if (selectItem) {
				if ($(e.target).filter(selectItem).length || self.isSelectorExist(e.target, target[0], selectItem)) {
					self.select({
						'id': data[0].id,
						'level': data[0].level
					});
				}
			} else {
				self.select({
					'id': data[0].id,
					'level': data[0].level
				});
			}
		});
	},

	/*
	 *	update specific item's content
	 *	@param	{object}	option
	 *	@param	{string}	content
	 */
	updateContent: function(option, content) {
		var targets = this.getItems(option);

		if (targets.length === 0) {
			return false;
		}

		targets.html(content);
	},

	/*
	 *	reset the menu
	 *	@param {object}	opts
	 */
	reset: function(opts) {
		opts = $.extend({}, this.opts, opts);
		this.menu.empty();
		this.init(opts);
	}
});

module.exports = Menu;
