/**
 * 参数操作配置
 * @Vincent
 * @DateTime 2016-10-11
 */
var $=require('/components/common/base/base.js');

/**
 * 参数操作缓存
 * @return   {string | object}                 默认参数
 */
module.exports=function(_default_param){
    // 默认参数 如{page:1}
    var default_param=getParamObj(_default_param);

    // 当前参数
    var param = $.extend(true,{},default_param);

    /**
     * 【私有方法】
     * 整理参数类型
     * @param    {string | object}      _param 需要配置的参数对象 或者 url字符串
     * @return   {object}                      整理后的参数对象
     */
    function getParamObj(_param){
        if(_param){
            var _type = typeof(_param);
            if(_type == 'string'){
                _param = $.url.queryToJson(_param);
            }else if(_type!='object'){
                _param = {};
            }
        }else{
            _param = {};
        }
        return _param;
    }

    // 参数转换对象
    function argToJson(_arg){
        var _param = {};
        if(_arg.length>1){
            _param[_arg[0]]=_arg[1];
        }else{
            _param = getParamObj(_arg[0]);
        }
        return _param;
    }

    // 清空对象内空的数据
    function clearObj(obj){
        var res={};
        for(var k in obj){
            var _tmp = obj[k];
            // 过滤空状态
            if(_tmp || _tmp==0){
                res[k]=_tmp;
            }
        }
        return res;
    }

    /**
     * 对外接口方法
     */
    return {
        /**
         * 配置默认参数
         * @param       {string | object}      _param 需要配置的参数对象 或者 url字符串
         * @param    {string | number}         _value 设置值 可选
         * @return      {object}                      配置后的参数对象（非默认，叠加当前参数）
         */
        setDefault:function(_param,_value){
            _param = argToJson(arguments);
            default_param = _param;
            param = $.extend(true,{},default_param,param);
            return this.get();
        },
        /**
         * 初始化配置当前参数
         * 传值为空则恢复默认值
         * @param    {object | string}         _param 需要配置的参数对象 或者 url字符串
         * @param    {string | number}         _value 设置值 可选
         * @return   {object}                         设置后的参数对象
         */
        set:function(_param,_value){
            _param = argToJson(arguments);
            param = $.extend(true,{},default_param,_param);
            return param;
        },
        /**
         * 获取缓存的参数
         * @param    {string}                 _type 返回类型 仅支持 string object 默认object
         * @param    {boolean}                filter_empty   是否清理空数据
         * @return   {string}                       根据_type参数不同 返回不同的参数类型
         */
        get:function(_type,filter_empty){
            // _type = _type!='string'?'object':_type;
            var res;
            if(_type=='string'){
                var _param = $.extend({},default_param,param);
                if(filter_empty){
                    _param = clearObj(_param);
                }
                res = $.url.jsonToQuery(_param);
            }else{
                res = $.extend(true,{},default_param,param);
            }
            return res;
        },
        /**
         * 获取某个Key的值
         * @param    {string}                 key 索引值
         * @return   {string undefined null number...}        获取的对应值
         */
        getKey:function(key){
            var val;
            if(key){
                val = param[key]!=undefined?param[key]:default_param[key];
            }
            return val;
        },
        /**
         * 更新参数 叠加更新参数(没有该参数，则增加 存在则更新)
         * @param    {object | string}         _param 需要更新的参数对象 或者 字符串
         * @param    {string | number}         _value 设置值 可选
         * @return   {object}                         设置后的参数对象
         */
        updata:function(_param,_value){
            _param = argToJson(arguments);
            param = $.extend(param,_param);
            return param;
        },
        /**
         * 删除参数
         * 特别注意：可以删除默认参数，但会修改原始配置的默认参数
         * @param    {array | string}                 keys 参数数组或者字符串
         * @return   {object}                         修改后的参数对象
         */
        delete:function(keys){
            if(typeof(keys)=='string'){
                delete param[keys];
                delete default_param[keys];
            }else if($.isArray(keys)){
                for(var i=0,l=keys.length;i<l;i++){
                    delete param[keys[i]];
                    delete default_param[keys];
                }
            }
            return param;
        },
        /**
         * 批量清理参数
         * @param    {array}                 filter  需要忽略的参数数组 默认空则清理所有参数 
         * @param    {boolean}                 all    是否保留默认参数 默认为false 清理后保留默认参数
         * @return   {object}                         修改后的参数对象
         */
        clear:function(filter_keys,all){
            var res={};
            if($.isArray(filter_keys)){
                for(var i=0,l=filter_keys.length;i<l;i++){
                    var key = filter_keys[i];
                    if(typeof(param[key])!='undefined'){
                        res[key]=param[key];
                    }
                }
            }
            if(!all){
                res = $.extend(true,{},default_param,res);
            }
            param=res;
            return param;
        },
        // 参数是否为空
        isEmpty:function(){
            return $.isEmptyObject(param);
        }
    };
};