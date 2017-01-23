/**
 * Created by zh.l.y on 2016/9/23.
 * 输入文字计数器 如：1/200
 */


var $ = require('myapp:components/common/base/base.js');


/**
 * opt.maxLength  长度限制
 * opt.target    输入对象选择器
 * opt.tmpl     展示模板字符串，注意： 分隔符用‘#{split}’替代, 最大长度用‘#{maxLength}’替代
 * opt.split    分隔符，默认为'/'
 * @param opt
 */

// 默认模板
var DEFAULT_TMPL = '<span class="length-box f-gray"><span class="current-length">0</span><span class="split-character">#{split}</span><span class="total-length">#{maxLength}</span></span>';


module.exports = function(opt){
    if(!opt){
        console.log('illegal  params');
        return;
    }
    if(!opt.maxLength){
        console.log('maxLength can not be empty');
        return;
    }

    if(!opt.target){
        console.log('target can not be empty');
        return;
    }

    if(!opt.tmpl){
        opt.tmpl = DEFAULT_TMPL;
    }

    var target = $(opt.target);

    var appendElmHtml = $.string.format(opt.tmpl, {
                            split: ( opt.split || '/' ),
                            maxLength: opt.maxLength
                        } );

    var appendElm = $(appendElmHtml);


    target.after(appendElm);

    target.on('change, input', function(){

        var value = $.trim($(this).val());

        var currentL = $.string.lenb(value);

        if(currentL > opt.maxLength){
            target.val($.string.subByte(value, opt.maxLength));
            value = $(this).val();
        }

        appendElm.children('.current-length').text($.string.lenb($.trim(value)));

    });

    target.trigger('input');
    
};
