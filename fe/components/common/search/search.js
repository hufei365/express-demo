/**
 * 搜索组件
 * @Vincent
 * @DateTime 2016-04-24
 */
var $	 =require('/components/common/base/base.js');
var Class=require('/components/common/class/class.js');
var Ajax=require('/components/common/ajax/ajax.js');
var Param = require('/components/common/param/param.js');


module.exports=Class(function(opt){
	this.option=$.extend({},this.default_option,opt);
	this.param = this.option.param || new Param();
}).extend({
	// 配置
	default_option:{
		$wrap:null,
		ele_input:'input:text', // 默认搜索文本框
		ele_submit:'a',	// 默认搜索按钮
		clickEvent:$.noop, // 点击搜索按钮处理方法
		focusEvent:$.noop,	// 输入框获取焦点
		keyupEvent:$.noop,	// 输入框输入过程
		blurEvent:$.noop,	// 输入框是去焦点
		onsearchBefore:$.noop,	// 搜索前处理 返回false 则不再继续执行 可以修改搜索参数
		base_filter:{
			keyword:'keyword',	// 默认搜索关键字
			page:'page'	// 默认翻页关键字
		},
		debug:false,	// 是否开启调试模式
		param:null,
		// 以下配置 仅针对ajax搜索配置处理
		search_url:'',
		is_only_end:true,	// 是否只获取最后一次搜索
		onSearch:$.noop,	// 搜索结果返回事件
		onError:$.noop      // 错误回调
	},
	option:{},
	// 搜索条件
	param:null,
	$input:null,
	$btn:null,
	last_time:0,
	// 初始化(可以重复初始化)
	init:function(){
		var $wrap=this.option.$wrap;
		if($wrap && $warp.length){
			this.bindEvent();
		}
	},
	// 初始化事件绑定
	bindEvent:function($wrap){
		var me=this;
		if($wrap){
			me.option.$wrap=$wrap;
		}else{
			$wrap=me.option.$wrap;
		}
		var key=me.option.base_filter.keyword;
		if($wrap){
			me.$input=$wrap.find(me.option.ele_input).off()
			.on('focus.search',function(evt){
				// 返回true 则执行搜索
				if(me.option.focusEvent.call(this,evt,me.param)){
					var keyword=$(this).val();
					me.param.updata(key,$.trim(keyword));
					me.search(1);
				}
			})
			.on('keyup.search',function(evt){
				var keyword=$(this).val();
				me.param.updata(key,$.trim(keyword));
				// 返回true 则执行搜索
				if(me.option.keyupEvent.call(this,evt,me.param)){
					me._debug(me.param);
					me.search(1);
				}
			})
			.on('blur.search',function(evt){
				// 返回true 则执行搜索
				var keyword=$(this).val();
				me.param.updata(key,$.trim(keyword));
				if(me.option.blurEvent.call(this,evt,me.param)){
					me.search(1);
				}
			});
			if(me.param.getKey(key)){
				me.$input.val(me.param.getKey(key));
			}
			/**
			 * 按钮点击 默认无返回false 则执行搜索
			 */
			me.$btn=$wrap.find(me.option.ele_submit).off()
			.on('click.search',function(evt){
				evt.preventDefault();
				var keyword=me.$input.val();
				me.param.updata(key,$.trim(keyword));
				// 返回true 或者 undefined 则执行搜索
				if(me._result(me.option.clickEvent.call(this,evt,me.param,me.$input))){
					me.search(1);
				}
			});
		}
	},
	// 获取当前筛选条件
	getFilter:function(key){
		// 避免被外层修改
		if(key){
			return this.param.getKey(key);
		}else{
			return this.param.get();
		}
	},
	/**
	 * 配置搜索条件 new 是否全部更新搜索 默认增量更新搜索条件
	 * @param {obj}  filter      筛选条件
	 * @param {Boolean} is_new      是否全部更新条件
	 * @param {Boolean}  auto_search 是否自动搜索
	 */
	setFilter:function(filter,is_new,auto_search){
		var me=this,
			keys=this.option.base_filter,
			page=this._defPage(filter);
		if(is_new){
			me.param.set(filter);
		}else{
			me.param.updata(filter);
		}
		// 页码归位
		me.param.updata([me.option.base_filter.page],page);
		// 清除关键词
		if(me.$input && me.$input.length){
			var keyword = me.param.getKey(keys.keyword);
			keyword=keyword?$.trim(keyword):'';
			me.$input.val(keyword);
		}
		auto_search && this.search(page);
	},
	/**
	 * 清空搜索条件
	 * @param {Boolean}  no_clear_keyword      不清空关键词
	 * @param {Boolean}  auto_search 是否自动搜索
	 */
	clearFilter:function(no_clear_keyword,auto_search){
		var me=this,
			keys=this.option.base_filter,
			keyword=me.param.getKey(keys.keyword);
		// 配置初始值
		me.param.clear();
		if(no_clear_keyword && keyword){
			me.param.updata(keys.keyword,keyword);
		}else{
			// 清除关键词
			if(me.$input && me.$input.length){
				me.$input.val('');
			}
		}
		// 页码归1
		me.param.updata(keys.page,1);
		auto_search && this.search(1);
	},
	// 配置新的搜索地址
	setSearchUrl:function(url,auto_search){
		this.option.search_url=url||'';
		auto_search && this.search(1);
	},
	/**
	 * 根据当前的搜索条件进行搜索
	 * @param  {[type]} page [description]
	 * @return {[type]}      [description]
	 */
	search:function(page){
		var me=this,
			key=me.option.base_filter.page;
		var old_page=me.param.getKey(key)||0;
		if(page){
			me.param.updata(key,parseInt(page));
		}
		me._debug(me.param);
		if(me._result(me.option.onsearchBefore(me.param))){
			me.fire('search.before',[me.param]);
			var url=me.option.search_url,
				filter=me.param.get();
			if(url){
				me.last_time=+new Date();
				// 发起请求
				Ajax.ajax({
					url:me.option.search_url,
					data:filter,
					custom:me.last_time,
					success:function(data,old_time){
						// 判断是否只接受最后一个请求
						if(!me.option.is_only_end || me.last_time==old_time){
							// 事件委托方式
							me.fire('search.result',[data,filter]);
							// 回掉处理方式
							me.option.onSearch(data,filter);
							filter=null;
						}
					},
					error: function(msg) {
						me.fire('search.error', [msg]);
						me.option.onError(msg);
						return true;
					}
				});
			}else{
				me.fire('search.result',[null,filter]);
				me.option.onSearch(null,filter);
			}
		}else if(old_page){
			me.param.updata(key,old_page);
		}
	},
	// 默认结果返回处理 只有方法返回false 0 NAN等才return false ,undefined返回true
	_result:function(result){
		if(result || typeof(result)=='undefined'){
			return true;
		}
		return false;
	},
	// 默认跳转
	_defPage:function(){
		var key=this.option.base_filter.page;
		if(this.param.getKey(key)){
			return this.param.getKey(key);
		}
		return 1;
	},
	// 调试模式输出
	_debug:function(param){
		this.option.debug && console.log(param.get());
	}
});
