/**
 * alan
 * 面包屑组件
 */

var $=require('/components/common/base/base.js');

/*
    opt={
        $ele        :   "jquery对象容器",
        sign        :   "分隔符标志,默认为>,可为空",
        describe    :   "导航开始前描述,可为空",
        style       :   "导航主题样式,可为空",
        menu        :   ["导航初始节点数组,可为空"]
    };

    opt.menu = {
             text   :   "节点文本",
             title  :   "节点title, 可为空",
             style  :   "",
             click  :   function(){
                             节点点击事件
                        }
    }
*/


/****************** 主函数，opt格式如上  ******************/
function Main(opt){

    if( !opt.$ele || opt.$ele.length == 0 ){
        return;
    }
    this.$container = opt.$ele;


    this.init(opt);
}

/****************** 初始化  ******************/
Main.prototype.init = function(opt){

    if(this.$mainEle){
        this.$mainEle.remove();
    }
    // 记录统一数据
    this.sign       = opt.sign      ? opt.sign      : (this.sign        || ">") ;
    this.describe   = opt.describe  ? opt.describe  : (this.describe    || "")  ;
    this.style      = opt.style     ? opt.style     : (this.style   || "")      ;
    this.menuArr    = opt.menu      ? opt.menu      : (this.menuArr || [])		;

    var $mainEle = this.$mainEle = this.getMainJEle(this.describe,this.style);

    for(var i = 0;i < this.menuArr.length;i++){
        var $menu = this.getMenuJEle(this.menuArr[i]);
        $mainEle.append($menu);
    }
    this.$container.html($mainEle);
};

/****************** 添加单一节点  ******************/
Main.prototype.add=function(option){
    this.$mainEle.append(this.getMenuJEle(option));
};

/****************** 移除节点后置对象  ******************/
Main.prototype.remove=function($ele){
    $ele.nextAll().remove();
};

/****************** 返回面包屑导航对象  ******************/
Main.prototype.getMainJEle=function(describe,style){

    describe+="";
    var html = "<div class='crumb-menu-main' style='"+style+"'>" + (describe.length>0?describe:"") + "</div>";
    return $(html);
};

/****************** 返回节点对象,menu格式见 opt.menu  ******************/
Main.prototype.getMenuJEle=function(menu){

    var _this   =   this;
    var html    =   "",
        index   =   0;

    if(_this.$mainEle.find("span").length>0){
        html    =   "<em>"+this.sign+"</em>";
        index   =   1;
    }
        html    +=  "<span title='"+(menu.title?menu.title:"")+"'  style='"+(menu.style?menu.style:"")+"'>"+menu.text+"</span>";

    var $ele=$(html);

    // 事件节点
    if(typeof menu.click == "function"){
        $ele.eq(index).on("click",function(){
            _this.remove($(this));
            menu.click();
        });
    }
    // 文本节点
    else{

        $ele.addClass("no-line");
    }
    return $ele;
};

module.exports = Main;
