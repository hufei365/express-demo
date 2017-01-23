/***
 * @preserve Router.js
 * @version 1.0.4
 * @author: Fabrizio Ruggeri
 * @website: http://ramielcreations.com/projects/router-js/
 * @license GPL-v2
 */
/**
 * 增加 redirect 调度方式： 是否载入历史记录行为
 * 增加配置了 子router对象sonRouter
 * 子Router对应的接口操作同router
 * 子Router下可以增加更深的子router(不推荐)
 * 子Router增加了getParent方法 获取父router
 * 子Router增加了getRoot方法 获取核心主router
 */

/*jshint expr:true */
(function(name, definition) {
    if (typeof module != 'undefined') module.exports = definition();
    else if (typeof define == 'function' && typeof define.amd == 'object') define(definition);
    else this[name] = definition();
}('Router', function() {
    
    /**
     * Provide Function Bind specification if browser desn't support it
     */
    if(!Function.prototype.bind) {
        Function.prototype.bind = function(object) {
            var originalFunction = this, args = Array.prototype.slice.call(arguments); object = args.shift();
            return function() {
                return originalFunction.apply(object, args.concat(Array.prototype.slice.call(arguments)));
            };
        };
    }

    /**
     * Commodity function to bind hashchange event
     *
     * @method     addHashchangeListener
     * @param      {DOMElement}  el        Element of DOM
     * @param      {function}    listener  Callback
     */
    function addHashchangeListener( el, listener ){
        if (el.addEventListener) {
          el.addEventListener('hashchange', listener, false); 
        } else if (el.attachEvent)  {
          el.attachEvent('hashchange', listener);
        }
    }

    /**
     * Commodity function to unbind hashchange event
     *
     * @method     removeHashchangeListener
     * @param      {DOMElement}  el        Element of DOM
     * @param      {function}    listener  Callback
     */
    function removeHashchangeListener( el, listener ){
        if (el.removeEventListener) {
          el.removeEventListener('hashchange', listener, false); 
        } else if (el.detachEvent)  {
          el.detachEvent('hashchange', listener);
        }
    }

    /**
     * Commodity function to extend parameters and default options
     *
     * @method     extend
     * @return     {object}  merged objects
     */
    function extend(){
        for(var i=1; i<arguments.length; i++)
            for(var key in arguments[i])
                if(arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[i][key];
        return arguments[0];
    }
    
    /**
     * Thanks to Sammy.js
     */
    var PATH_REPLACER = "([^\/\\?]+)",
        PATH_NAME_MATCHER = /:([\w\d]+)/g,
        PATH_EVERY_MATCHER = /\/\*(?!\*)/,
        PATH_EVERY_REPLACER = "\/([^\/\\?]+)",
        PATH_EVERY_GLOBAL_MATCHER = /\*{2}/,
        PATH_EVERY_GLOBAL_REPLACER = "(.*?)\\??",
        LEADING_BACKSLASHES_MATCH = /\/*$/;
    
    /**
     * Http Request constructor
     * @param      {string}  href    Url for request object
     * @class      Request
     * @name       Request 
     * @classDesc Class representing a single http request
     */
    var Request = function(href){
        /**
         * The href of this request
         * @type {string}
         * @memberof Request
         * @instance
         * @name href
         * @public
         */
        this.href = href;
        /**
         * Contains params with which this request is launched
         * @type {object}
         * @memberof Request
         * @instance
         * @name params
         * @public
         */
        this.params = {};
        /**
         * GET Query object
         * @type {object}
         * @memberof Request
         * @instance
         * @name query
         * @public
         */
        this.query = {};
        /**
         * Contains any generic regex matched parameters
         * @type {object}
         * @memberof Request
         * @instance
         * @name splat
         * @public
         */
        this.splat = {};
        /**
         * If true another route matched the request and you are able to call next
         * @type {Boolean}
         * @memberof Request
         * @instance
         * @name hasNext
         * @public
         */
        this.hasNext = false;
    };

    /**
     * Return value passed in request using, in order params, query and
     * default_value if provided
     *
     * @memberOf   Request
     *
     * @method     get
     * @param      {string}            key            Key of the value to
     *                                                retrieve
     * @param      {*}                 default_value  Default value if nothing
     *                                                found. Default to nothing
     * @return     {String|undefined}  param value
     */
    Request.prototype.get = function(key, default_value){
        return (this.params && this.params[key] !== undefined) ? 
                this.params[key]
                : (this.query && this.query[key] !== undefined) ?
                    this.query[key]
                    : (default_value !== undefined) ?
                        default_value : undefined;
    };

    /**
     * Construct a router
     *
     * @classDesc Router main class
     * @param      {object}  [options]  Options for the instance of the router
     * @param      {boolean}  [options.ignorecase=true]  If false casing matters in
     *                                                   routing match
     * @class      Router
     * @name       Router
     */
    var Router = function(options) {
        this._options = extend({ignorecase: true}, options || {});
        this._routes = [];
        this._befores = [];
        this._errors = {
            '_'     : function(err, url, httpCode) {
                if(console && console.warn) console.warn('Router.js : '+httpCode);
            },
            '_404'  : function(err, url) {
                if(console && console.warn) console.warn('404! Unmatched route for url ' + url);
            },
            '_500'  : function(err, url) {
                if(console && console.error) console.error('500! Internal error route for url ' + url);
                else{
                    throw new Error('500');
                }
            }
        };
        this._paused = false;
        this._hasChangeHandler = this._onHashChange.bind(this);
        addHashchangeListener(window,this._hasChangeHandler);
    };
    Router.className = 'Router';
    /**
     * Hander for hashchange event
     *
     * @memberOf Router
     *
     * @method     _onHashChange
     * @param      {object}   e       - Event of hashchange
     * @return     {boolean}  this method returns true
     *
     * @private
     */
    Router.prototype._onHashChange = function(e){
        if(!this._paused){
            this._route( this._extractFragment(window.location.href) );
        }
        return true;
    };
    
    /**
     * Extract fragments from url (everything after '#')
     *
     * @memberOf Router
     *
     * @method     _extractFragment
     * @param      {String}  url     The complete url
     * @return     {String}  Route fragment
     *
     * @private
     */
    Router.prototype._extractFragment = function(url){
        var hash_index = url.indexOf('#');
        return hash_index >= 0 ? url.substring(hash_index) : '#/';
    };

    /**
     * Internally launched when an error in route or in nexts happens
     *
     * @memberOf Router
     *
     * @method     _throwsRouteError
     * @param      {string|number}  httpCode  The httpCode of the error to
     *                                        thrown
     * @param      {object}         err       Error to thrown
     * @param      {string}         url       Url which generated the error
     * @private
     * @return     {boolean}        Always false
     */
    Router.prototype._throwsRouteError = function( httpCode, err, url ) {
        if(this._errors['_'+httpCode] instanceof Function)
            this._errors['_'+httpCode](err, url, httpCode);
        else{
            this._errors._(err, url, httpCode);
        }
        return false;
    };
    
    
    /**
     * Build a request object based on passed information
     *
     * @memberOf Router
     *
     * @method     _buildRequestObject
     * @param      {String}   fragmentUrl  The fragment from the url
     * @param      {object}   params       Params of request if any. Not
     *                                     mandatory @throw error Error if
     *                                     urlObj is not
     * @param      {object[]}   splat        An array of splat matching
     * @param      {boolean}  hasNext      True if the request has next
     * @param      {object}  urlObj
     * @return     {object}   Request object
     *
     * @private
     */
    Router.prototype._buildRequestObject = function(fragmentUrl, params, splat, hasNext){
        if(!fragmentUrl)
            throw new Error('Unable to compile request object');
        var request = new Request(fragmentUrl);
        if(params)
            request.params = params;
        var completeFragment = fragmentUrl.split('?');
        if(completeFragment.length == 2){
            var queryKeyValue = null;
            var queryString = completeFragment[1].split('&');
            request.query = {};
            for(var i = 0, qLen = queryString.length; i < qLen; i++){
                queryKeyValue = queryString[i].split('=');
                request.query[decodeURI(queryKeyValue[0])] = decodeURI(queryKeyValue[1].replace(/\+/g, '%20'));
            }
            request.query;
        }
        if(splat && splat.length > 0){
            request.splats = splat;
        }
        if(hasNext === true){
            request.hasNext = true;
        }
        return request;
    };

    /**
     * Internally launched when routes for current hash are found
     *
     * @memberOf Router
     *
     * @method     _followRoute
     * @param      {String}  fragmentUrl     The fragment from the url
     * @param      {String}  url             Url which fired this route
     * @param      {array}   matchedIndexes  Array of matched indexes
     * @private
     * @return     {Function}  A callable which run the next matching route
     */
    Router.prototype._followRoute = function( fragmentUrl, url, matchedIndexes , son) {
        var index = matchedIndexes.splice(0, 1), 
            route = !son?this._routes[index]:
                                son._routes[index], 
            match = url.match(route.path), 
            request, 
            params = {},
            splat = [];
        if(!route){
            return this._throwsRouteError(500, new Error('Internal error'), fragmentUrl);
        }
        /*Combine path parameter name with params passed if any*/
        for(var i = 0, len = route.paramNames.length; i < len; i++) {
            params[route.paramNames[i]] = match[i + 1];
        }
        i = i+1;
        /*If any other match put them in request splat*/
        if( match && i < match.length){
            for(var j = i;j< match.length;j++){
                splat.push(match[j]);
            }
        }
        /*Build next callback*/
        var hasNext = (matchedIndexes.length !== 0);
        var next = (
            function(uO, u,mI, hasNext){
                return function(hasNext, err, error_code){
                    if(!hasNext && !err){
                        return this._throwsRouteError( 500, 'Cannot call "next" without an error if request.hasNext is false', fragmentUrl );
                    }
                    if(err) 
                        return this._throwsRouteError( error_code || 500, err, fragmentUrl );
                    this._followRoute(uO, u, mI, son);
                    }.bind(this, hasNext);
                }.bind(this)(fragmentUrl, url, matchedIndexes, hasNext)
        );
        request = this._buildRequestObject( fragmentUrl, params, splat, hasNext );
        route.routeAction(request, next);
    };
    
    /**
     * Internally call every registered before
     *
     * @memberOf Router
     *
     * @method     _routeBefores
     * @param      {function[]}  befores         Array of befores callback
     * @param      {function}    before          Actual before
     * @param      {String}      fragmentUrl     The fragment from the url
     * @param      {String}      url             Url which fired this route
     * @param      {array}       matchedIndexes  Array of matched indexes
     * @private
     * @return     {void}
     */
    Router.prototype._routeBefores = function(befores, before, fragmentUrl, url, matchedIndexes ,son) {
        var next;
        if(befores.length > 0) {
            var nextBefore = befores.splice(0, 1);
            nextBefore = nextBefore[0];
            next = function(err, error_code) {
                if(err)
                    return this._throwsRouteError( error_code || 500, err, fragmentUrl);
                this._routeBefores(befores, nextBefore, fragmentUrl, url, matchedIndexes , son);
            }.bind(this);
        } else {
            next = function(err, error_code) {
                if(err)
                    return this._throwsRouteError( error_code || 500, err, fragmentUrl);
                this._followRoute(fragmentUrl, url, matchedIndexes, son);
            }.bind(this);
        }
        before( this._buildRequestObject( fragmentUrl, null, null, true ), next );
    };
    
    /**
     * On hashChange route request through registered handler
     *
     * @memberOf Router
     *
     * @method     _route
     * @param      {String}   fragmentUrl  The fragment from the url
     * @private
     * @return     {boolean}
     */
    Router.prototype._route = function( fragmentUrl ,son) {
        var route = '',
            /*Take a copy of befores cause is nedeed to splice them*/
            befores = !son?this._befores.slice():
                                son._befores.slice(),
            matchedIndexes = [],
            urlToTest;
        var url = fragmentUrl;
        if(url.length === 0)
            return true;
        url = url.replace( LEADING_BACKSLASHES_MATCH, '');
        urlToTest = (url.split('?'))[0]
              .replace( LEADING_BACKSLASHES_MATCH, '');/*Removes leading backslashes from the end of the url*/
        /*Check for all matching indexes*/
        var routes = !son?this._routes:son._routes;
        for(var p in routes) {
            if(routes.hasOwnProperty(p)) {
                route = routes[p];
                if(route.path.test(urlToTest)) {
                    matchedIndexes.push(p);
                }
            }
        }
        
        if(matchedIndexes.length > 0) {
            /*If befores were added call them in order*/
            if(befores.length > 0) {
                var before = befores.splice(0, 1);
                before = before[0];
                /*Execute all before consecutively*/
                this._routeBefores(befores, before, fragmentUrl, url, matchedIndexes,son);
            } else {
                /*Follow all routes*/
                this._followRoute(fragmentUrl, url,  matchedIndexes,son);
            }
        /*If no route matched, then call 404 error*/
        } else {
            return this._throwsRouteError(404, null, fragmentUrl);
        }
    };
    
    /**
     * Pause router to be bound on hashchange
     *
     * @memberOf Router
     *
     * @method     pause
     * @return     {Router}  return this router for chaining
     */
    Router.prototype.pause = function(){
        this._paused = true;
        return this;
    };
    
    /**
     * Unpause router to be bound on hashchange
     *
     * @memberOf Router
     *
     * @method     play
     * @param      {Boolean}  triggerNow  - If true evaluate location
     *                                    immediately
     * @return     {Router}   return this router for chaining
     */
    Router.prototype.play = function(triggerNow){
        triggerNow = 'undefined' == typeof triggerNow ? false : triggerNow;
        this._paused = false;
        if(triggerNow){
            this._route( this._extractFragment(window.location.href) );
        }
        return this;
    };
    
    /**
     * Set location but doesn't fire route handler
     *
     * @memberOf Router
     *
     * @method     setLocation
     * @param      {String}  url     - Url to set location to
     * @return     {Router}  return this router for chaining
     */
    Router.prototype.setLocation = function(url){
        if(window.history.pushState){
            window.history.pushState(null,'',url);
        }
        return this;
    };
    
    /**
     * Set location and fires route handler
     *
     * @memberOf Router
     *
     * @method     redirect
     * @param      {String}  url     Url to redirect to
     * @return     {Router}  return this router for chaining
     * -----------------------------------------------------------------------
     * @Vincent 增加是否载入历史记录行为
     * @param {B} replace_history 是否替换当前历史记录
     */
    Router.prototype.redirect = function(url,replace_history){
        if(replace_history){
            window.history.replaceState(null,'',url);
        }else{
            this.setLocation(url);
        }
        if(!this._paused)
            this._route( this._extractFragment(url) );
        return this;
    };

    /**
     * This callback is called when this route is matched
     * @callback Router~routeCallback
     * @param {Request} req - the request object
     * @param {function} next - Call it next matching route should be fired
     */

    
    Router.prototype.addRoute = 
    Router.prototype.add = 
    Router.prototype.route = 
    /**
     * Add a routes to possible route match. Alias : route, add, get
     *
     * @memberOf Router
     *
     * @method     get
     * @param      {string|RegExp}         path      A string or a regular
     *                                               expression to match
     * @param      {Router~routeCallback}  callback  - Is fired on path match
     * @return     {Router}                return this router for chaining
     */
    Router.prototype.get = function(path, callback) {
        var match, 
            modifiers = (this._options.ignorecase ? 'i' : ''), 
            paramNames = [];
        if('string' == typeof path) {
            /*Remove leading backslash from the end of the string*/
            path = path.replace(LEADING_BACKSLASHES_MATCH,'');
            /*Param Names are all the one defined as :param in the path*/
            while(( match = PATH_NAME_MATCHER.exec(path)) !== null) {
                paramNames.push(match[1]);
            }
            path = new RegExp(path
                          .replace(PATH_NAME_MATCHER, PATH_REPLACER)
                          .replace(PATH_EVERY_MATCHER, PATH_EVERY_REPLACER)
                          .replace(PATH_EVERY_GLOBAL_MATCHER, PATH_EVERY_GLOBAL_REPLACER) + "(?:\\?.+)?$", modifiers);
        }
        this._routes.push({
            'path' : path,
            'paramNames' : paramNames,
            'routeAction' : callback
        });
        return this;
    };


    /**
     * Adds a before callback. Will be fired before every route
     *
     * @memberOf Router
     *
     * @method     before
     * @param      {Router~routeCallback}  callback  Fired on before match
     * @return     {Router}                return this router for chaining
     */
    Router.prototype.before = function(callback) {
        this._befores.push(callback);
        return this;
    };


    /**
     * This callback is called when this route is matched
     * @callback Router~errorCallback
     * @param {object} err - the error
     * @param {string} href - Href which fired this error
     */
    
    
    /**
     * Adds error callback handling for Http code
     *
     *
     * @memberOf Router
     *
     * @method     errors
     * @param      {Number}                httpCode  Http code to handle just
     *                                               like 404,500 or what else
     * @param      {Router~errorCallback}  callback  Handler for error
     * @return     {Router}                return this router for chaining
     */
    Router.prototype.errors = function(httpCode, callback) {
        if(isNaN(httpCode)) {
            throw new Error('Invalid code for routes error handling');
        }
        if(!(callback instanceof Function)){
            throw new Error('Invalid callback for routes error handling');
        }
        httpCode = '_' + httpCode;
        this._errors[httpCode] = callback;
        return this;
    };
    
    /**
     * Run application. Note that calling this is not mandatory. Calling it just
     * force application to evaluate current or passed url
     *
     * @memberOf Router
     *
     * @method     run
     * @param      {String}  startUrl  Url to redirect application on startup.
     *                                 Default is current location
     * @return     {Router}  return this router for chaining
     */
    Router.prototype.run = function( startUrl ){
        if(!startUrl){
            startUrl = this._extractFragment(window.location.href);
        }
        startUrl = startUrl.indexOf('#') === 0 ? startUrl : '#'+startUrl;
        this.redirect( startUrl );
        return this;
    };

    /**
     * Remove every reference to DOM and event listeners
     *
     * @memberOf Router
     *
     * @method     destroy
     * @return     {Router}  This router
     */
    Router.prototype.destroy = function(){
        removeHashchangeListener(window, this._hasChangeHandler);
        return this;
    };


    /**
     * 配置子路由
     * @Vencent
     * @DateTime 2016-07-07T17:37:15+0800
     * @param    {string}                 baseUrl   #/custom
     * @param    {function}               beforeFun 触发事件
     * @return   {Son}                              子路由对象
     */
    Router.prototype.sonRouter=function(baseUrl,beforeFun){
        var r=this;
        /**
         * 定义路由子对象
         * 配置原则尽可能保持跟原有配置相同的接口
         * 以保证模块开发的独立
         * @Vencent
         * @DateTime 2016-07-07T15:57:06+0800
         * @param    {string}                 _url 配置自对象基础URL
         */
        var Son = function(_url){
            this._options = r._options;
            this.baseUrl = _url; //当前配置的父级地址
            this.nowUrl = ''; //当前父级url
            this.splats = ''; //当前子级url
            this._routes = []; // 子路由规则
            this._befores = []; // 子路由处理
            this.router = null; // 指定Router自身
        };
        Son.className='Son';
        /**
         * 复写router各对应接口
         */
        Son.prototype.addRoute = 
        Son.prototype.add = 
        Son.prototype.route = 
        Son.prototype.get=function(path,callback){
            // 理论上这里之后也不应该出现# ?等符号 这里没有做处理
            if(path.indexOf('#/')===0){
                path = path.replace('#','');
            }
            return r.get.bind(this)(path,callback);
        };
        Son.prototype.before=function(callback){
            this._befores.push(callback);
            return this;
        };
        Son.prototype.setLocation = function(url){
            if(url.indexOf('#/')===0){
                url = url.replace('#','');
            }
            if(window.history.pushState){
                url = url.indexOf('/')===0?url.replace('/',''):url;
                window.history.pushState(null,'',this.nowUrl+url);
            }
            return this;
        };
        Son.prototype.redirect = function(url,replace_history){
            if(url.indexOf('#/')===0){
                url = url.replace('#','');
            }
            if(replace_history){
                window.history.replaceState(null,'',url);
            }else{
                this.setLocation(url);
            }
            if(!this.router._paused){
                this.router._route(url,this);
            }
            return this;
        };
        Son.prototype.play = function(triggerNow){
            triggerNow = 'undefined' == typeof triggerNow ? false : triggerNow;
            var router = this.router;
            router._paused = false;
            if(triggerNow){
                if(this.splats){
                    router._route(this.splats,this);
                }else{
                    router._route( router._extractFragment(window.location.href) );
                }
            }
            return this;
        };
        Son.prototype.sonRouter=function(path,be){
            return r.sonRouter.bind(this)(path,be);
        };
        // 获取原始router对象
        Son.prototype.getRoot=function(){
            return this.router;
        };
        // 获取父级
        Son.prototype.getParent=function(){
            return r;
        };

        var son=new Son(baseUrl);
        // 配置自身router指向
        if(r.constructor.className=='Router'){
            son.router = r;
        }else if(r.constructor.className=='Son'){
            son.router = this.router;
        }
        /**
         * 配置路由
         * 调用方式：
         * router.sonRouter('#/custom/:page'),function(req,next){});
         */
        r.route(baseUrl+'/**',function(req, next){
            if(!req.splats.length){
                return true;
            }
            var url = '/'+req.splats[0];
            var query_index=req.href.indexOf('?');
            if(query_index>=0){
                url += req.href.substring(query_index);
            }
            son.splats = url;
            // 记录当前前缀地址
            son.nowUrl = req.href.substring(0,req.href.lastIndexOf(req.splats));
            var go_next=true;
            if(!son.router._paused){
                if(typeof beforeFun == 'function'){
                    go_next = beforeFun.bind(r)(req);
                    go_next = (typeof(go_next) == 'undefined' || go_next)?true:false;
                }
                if(go_next){
                    son.router._route( url,son);
                }
            }
            if(req.hasNext && go_next){
                next();
            }
        });
        return son;
    };

    return Router;
}));
