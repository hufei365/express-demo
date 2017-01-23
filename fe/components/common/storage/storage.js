/**
 * Created by alan on 16/1/19.
 *
 * 本地存储
 * 分为本地持久化存储和本地当前存储
 *
 * 本地持久化存储：优先考虑localStorage，当为ie低版本的时候，使用date_buffer
 * 
 * 本地当前存储：仅限于页面打开状态时存储。优先使用sessionStorage，不被支持时使用cookie
 *
 * sessionStorage 增加过期时间
 */
var $ = require('/components/common/base/base.js');





var storage={
    init:function(){
        // 待用
    },
    // 本地持久化存储
    local:{
        _init:function(){
            var dataBuffer=document.getElementsByName("data_buffer")[0];
            console.log(dataBuffer);
            if(!dataBuffer){
                var formDataBuffer=document.createElement("form");
                formDataBuffer.name="data_buffer";
                var inputDataStorage=document.createElement("input");
                inputDataStorage.setAttribute("type","hidden");
                inputDataStorage.setAttribute("id","data_storage");
                inputDataStorage.setAttribute("style","behavior: url(#default#userdata)");

                formDataBuffer.appendChild(inputDataStorage);
                document.body.appendChild(formDataBuffer);
            }
        },
        get:function(key){
            var data;
            if(window.localStorage){
                data = localStorage.getItem(key);
                if(!data){
                    return null;
                }
                else{
                    data+="";
                }
                if(/;eDate=\d{13}$/.test(data)){
                    data = data.substr(0,data.length-20);
                }
            }else{
                this._init();
                var oPersist=data_buffer.data_storage;
                oPersist.load("shoppingList");
                data = oPersist.getAttribute(key);
            }
            return data;
        },
        set:function(key,value,expirationDay){
            if(window.localStorage){
                if(expirationDay){
                    var date   = new Date();
                    var exDate = date.setDate(date.getDate()+expirationDay);
                    value = value+";eDate="+exDate;
                }

                localStorage.setItem(key,value);
            }else{
                this._init();
                var oPersist=data_buffer.data_storage;
                oPersist.setAttribute(key,value);
                oPersist.save("shoppingList");
            }
        },
        delete:function(key){
            if(window.localStorage){
                localStorage.removeItem(key);
            }else{
                this._init();
                var oPersist=data_buffer.data_storage;
                oPersist.load('shoppingList');
                oPersist.removeAttribute(key);
                oPersist.save('shoppingList')
            }
        },
        clearExpiration:function(key){
            storage.clear(window.localStorage,key);
        },
        deleteNullOfValue:function(){
            storage.deleteNullOfValue(window.localStorage);
        }
    },
    // 本地当前存储
    session:{
        get:function(key){
            var data;
            if(window.sessionStorage){
                data = sessionStorage.getItem(key);
                data=data?data+"":data;
                if(/;eDate=\d{13}$/.test(data)){
                    data = data.substr(0,data.length-20);
                }
            }else{
                data = $.cookie.getRaw(key);
            }
            return data;
        },
        set:function(key,value,expirationDay){
            if(window.sessionStorage){

                if(expirationDay){
                    var date   = new Date();
                    var exDate = date.setDate(date.getDate()+expirationDay);
                    value = value+";eDate="+exDate;
                }

                sessionStorage.setItem(key,value);
            }else{
                $.cookie.setRaw(key,value,{expires:expirationDay});
            }
        },
        delete:function(key){
            if(window.sessionStorage){
                sessionStorage.removeItem(key);
            }else{
                $.cookie.del(key);
            }
        },
        clearExpiration:function(key){
            storage.clear(window.sessionStorage,key);
        },
        deleteNullOfValue:function(){
            storage.deleteNullOfValue(window.sessionStorage);
        }

    },
    clear:function(storage,key){
        if(!storage){
            return;
        }
        if(key){
            storage.removeItem(key);
            return;
        }

        for(var sessionKey in storage){
            var value=storage[sessionKey];

            if(/;eDate=\d{13}$/.test(value)){
                var eDate = +value.match(/\d{13}$/)[0];
                var now = (new Date()).getTime();
                if(eDate<=now){
                    storage.removeItem(sessionKey);
                }
            }
        }
    },
    deleteNullOfValue:function(storage){
    if(!storage){
        return;
    }
    for(var sessionKey in storage){
        var value=storage[sessionKey];
        if(!value){
            storage.removeItem(sessionKey);
        }
    }
}
};
module.exports=storage;
