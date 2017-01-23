/**
 * @author y.g.q
 * @time 20150515
 */


var $     	  = require('myapp:components/common/base/base.js'),
    ec        = require('myapp:components/common/event/event.js'),
    uiClass   = require('myapp:components/common/class/class.js');
require('myapp:components/lib/jquery.ui/dialog.js');
require('myapp:components/lib/jquery.ui/effect-fade.js');
require('myapp:components/lib/jquery.ui/effect-drop.js');


// 重写 jquery.ui dialog 中的_init, 打开之前先将 button 变更;
// 将dialog 中 buttonpane 的 button 元素改成 a;
if ( $.ui.dialog ) {

    var _init = $.ui.dialog.prototype._init;
    $.ui.dialog.prototype._init = function() {
        var buttons = this.options.buttons;
        if ( $.isArray(buttons) ) {
            this._buttonset( this.options.buttons );
        }
        _init.call( this, arguments );
        if(this.options.draggable){
            draggableStop.call( this );
        }
    };
    $.ui.dialog.prototype._buttonset = function( buttons ) {
        var uiContent   = this.uiDialogTitlebar.next(),
            uiButtonSet = this.uiButtonSet;
        if ( buttons.length ) {
            uiButtonSet.empty();
        }
        $( buttons ).each(function( index ) {

            var button = this;

            var btnColor=['btn-blue-bg',' btn-gray-line'];

            $('<a href="#" />')
                .text( button.text || '' )
                .addClass(button['className'] || "btn ml-10 "+(btnColor[index]))
                .on('click', function( e ) {
                    e.preventDefault();
                    button.click.apply(uiContent, arguments);
                })
                .appendTo( uiButtonSet );
        });
    };

    // draggable 会在 _normalizeRightBottom 中将窗口实际宽高加入 element style 中;
    // 会影响不固定高度的弹窗, 这里做不允许设置高处理;
    function draggableStop() {
        var uiDialog = this.uiDialog;
        var stopFn = uiDialog.draggable('option', 'stop');
        if ( stopFn ) {
            uiDialog.draggable('option', 'stop', function( event, ui ) {
                stopFn.apply( this, arguments );
                uiDialog.height( 'auto' );
            });
        }
    }

}


var _instances = {};

/**
 * @class Dialog
 * @description 弹窗
 * @example new Dialog(options)
 * @param 	{Object}			options
 * @config	{String|Element}	target			外部创建窗体，可为空
 * @config	{String}			width			窗体宽度
 * @config	{String}			closeText		关闭窗体按钮文字描述
 * @config 	{Boolean}			draggable		窗体拖动
 * @config  {String}			dialogClass		窗体最外层className（有高优先级）
 * @config	{String}			btnAlign		按钮位置（left | center | right）
 * @config	{Object}			show			窗体打开时动画
 * @config	{String}		effect 			效果，参见 components/lib/jquery.ui/effect*.js
 * @config	{String}		direction		出现位置
 * @config	{Object}			hide			窗体关闭时动画
 * @config	{String}		effect 			效果，参见 components/lib/jquery.ui/effect*.js
 * @config	{String}		direction		出现位置
 * @config	{Function}			beforeClose
 */
var Dialog = uiClass().extend({
    init: function(options) {
        var me = this;
        options = $.extend({
            modal: true,
            width: '360px',
            closeText: '关闭',
            resizable: false,
            draggable: true,
            dialogClass: options.className,
            btnAlign: 'right',
            show: {
                effect: "fade"
            },
            hide: {
                effect: "fade"
            },
            beforeClose: function() {
                $(window).unbind('resize', Resize);
            }
        }, options || {});

        if ( !options.target ) {
            me.instance = $('<div>', {
                id: 'ks-dlg-' + me.guid
            }).html(options.content).dialog(options);
        } else {
            me.instance = $(options.target).dialog(options);
        }
        // 设置 buttonpane align;
        me.instance.next().css('text-align', options['btnAlign']);

        if (options.autoDispose) {
            me.instance.on('dialogclose', function() {
                $(this).dialog('destroy').remove();
                delete _instances[me.guid];
            });
        }

        _instances[me.guid] = me.instance;

        function Resize() {
            if ( me ) {
                me.center();
                me.isTop();
            }
        }

        $(window).on('resize', Resize);
    },
    open: function() {
        this.instance.dialog('open');
    },
    close: function() {
        this.instance.dialog('close');
    },
    isTop: function() {
        var dig = this.instance.parent();
        if ( parseInt(dig.css('top')) < 0 ) {
            dig.css( 'top', 0 );
        }
    },
    center: function() {
        this.instance &&
        this.instance.dialog &&
        this.instance.dialog('option', 'position', {
            my: 'center',
            at: 'center',
            of: window
        });
    },
    getDialogContainer: function() {
        return this.instance.dialog('widget');
    },
    getButtonSet: function() {
        return this.instance.dialog('instance').uiButtonSet;
    },
    /*
     * @param {Object} size
     * @config {Number} size.width
     * @config {Number} size.height
     */
    setSize: function(size) {
        this.instance.dialog('option', size);
    },
    setTitle: function(title) {
        if (title) {
            this.instance.dialog('option', 'title', title);
        }
    }
});

ec.on('dialog.close', function() {
    Dialog.close();
});


module.exports = $.extend(Dialog, {
    'alert': function(content, options) {
        // 这里是个坑, 一旦dialog高度超过浏览器会影响到窗口跳到底部, 时间紧迫从简解决;
        var scrollbar,
            options = $.extend(true, {
                title: '提示',
                content: content,
                autoDispose: true,
                buttons: [{
                    'text': '确定',
                    'click': function() {
                        $.isFunction(options.onaccept) && options.onaccept.apply(this, arguments);
                        $(this).dialog("close");
                    }
                }],
                open: function() {
                    // var uiDialog = $( this ).parent();
                    // setTimeout(function(){
                    // 	scrollbar = new ScrollBar({
                    // 		container: uiDialog
                    // 	});
                    // 	$(window).height() < uiDialog.height()
                    // 		&& scrollbar.to(-1);
                    // }, 600);
                },
                close: function() {
                    scrollbar && scrollbar.destroy();
                }
            }, options);
        return new Dialog(options);
    },
    'confirm': function(content, options) {
        options.buttons = options.buttons || [{
                'text': '确定',
                'className': 'btn  btn-blue-bg ml-10',
                'click': function() {
                    $.isFunction(options.onaccept) && options.onaccept.apply(this, arguments);
                }
            }, {
                'text': '取消',
                'className': 'btn btn-gray-line ml-10 ',
                'click': function() {
                    $.isFunction(options.oncancel) && options.oncancel.apply(this, arguments);
                    $(this).dialog("close");
                }
            }];
        return Dialog.alert(content, options);
    },
    'iframe': function(options) {
        var content = '<iframe frameborder="no" class="ui-dialog-content-iframe" src="' + options.content + '"></iframe>';
        options.content = content;
        if (!options.buttons) {
            options.buttons = [];
        }
        options.dialogClass = 'dialog-iframe';
        return Dialog.alert(content, options);
    },
    'close': function() {
        $.each(_instances, function(guid, _instance) {
            try {
                _instance && _instance.dialog('close');
            } catch (e) {}
        });
    }
});
