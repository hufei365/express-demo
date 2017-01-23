


module.exports = {
    pad: function (number, length) {
        var len = length - ('' + Math.abs(number)).length + 1;
        return Array(len > 0 ? len : 0).join(0) + number;
    },

    /**
	* [listIndex 获取列表序号]
     * @return {[int]} index  [当前页第几项， 从0开始]
     * @param  {[int]} page   [当前第几页，从1开始]
     * @param  {[int]} size   [每页显示多少条, 默认为10]
     * @return {[int]}        [在列表中序号]
     */
    listIndex: function ( index, page, size ) {

		index 	= 	index || 0;
		page 	= 	(page - 1) || 0;
		size 	= 	size || 10;

		return ( page * size + index + 1 );

    },

	/*
	 * 格式化文件大小
	 * @param {Number} bytes	字节数
	 * @param {Number} dot		省略至几位数
	 * @return {String}
	 */
    formatFileSize: function(bytes, dot) {
        var unitArr = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var index = 0;
        var quotient = bytes;

        while(quotient > 1024){
            index += 1;
            quotient = quotient / 1024;
        }
        return quotient.toFixed(dot) + unitArr[index];
    }
};
