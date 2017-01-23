/**
 * 基础服务 数据代理
 * @Vincent
 * @DateTime 2016-4-24
 */
var $=require('/components/common/base/base.js');
var Ajax=require('/components/common/ajax/ajax.js');

// 用户基础信息
var user = F.data("user");

/**
 * 分析存储Key
 * @param    {string}                 url   基础URL
 * @param    {obj | string}                 param 参数
 * @return   {string}                       生成Key
 */
function getCacheKey(url, param){
	var key = ['fdata_'];
	key.push(url.replace(/\//g, '_'));
	if(typeof param == 'object'){
		key.push('_');
		$.each(param, function(i,v){
			key.push(i);
			key.push('_');
			key.push(v);
			key.push('_');
		});
	}
	return key.join('');
}


module.exports = {
	/**
	 *Ajax 二次封装,优先从缓存获取,没有则发请求,并缓存结果
	 *16.08.19 增加链式操作支持 getDataCacheFirst().done().fail().always();
	 *16.09.26 增加数据处理回调dataHandle 用于ajax获取数据后优先处理整理数据
	 **/
	getDataCacheFirst : function(url, params, callback,dataHandle){
		callback = $.isFunction(callback)?callback:$.noop;
		var dtd = $.Deferred();
		var key = getCacheKey(url,params);
		var local=F.data(key);
		if(local){
			local = $.extend(true,{},local);
			callback(local);
			dtd.resolve(local);
			return dtd;
		}
		Ajax.get(url, params, function(data){
			if(data){
				data = $.isFunction(dataHandle)?dataHandle(data):data;
				F.data(key,data);
				local = $.extend(true,{},data);
				callback(local);
				dtd.resolve(local);
			}else{
				callback();
				dtd.reject();
			}
		},function(){
			callback();
			dtd.reject();
		});
		return dtd;
	},
	// 删除缓存
	delDataCache:function(url,params){
		var key = getCacheKey(url,params);
		var local=F.data(key);
		if(local){
			F.data(key, null);
		}
	}
};
