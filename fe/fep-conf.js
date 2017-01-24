/**
 * @author zh.l.y
 * @time 20170123
 */


fis.set('namespace', fis.get('fep.namespace') || 'myapp');
fis.set('charset', 'utf-8');
var _namespace = fis.get('namespace');
var _domain = fis.get('fep').domain;

// 部署配置;
fis.util.map([{
	name: 'dev',
	host: 'localhost',
	port: '3000'
}], function (index, item) {

	var static_domain   = '//localhost'+ ':'+ item.port ;

	/**
	 * 发布到本机 开发环境发布配置
	 */
	fis.util.map(['', 'm', 'mock'], function (_index, _val) {

		fis.media( _val + item.name )
			// js, css, scss加md5;
			.match('**.{js,css,scss}', {
				useHash: true
			})
			// 图片加md5;
			.match(':image', {
				useHash: true
			})
			.match('::package', {
				// 图片合并
				spriter: fis.plugin('csssprites', {
					// 排列方式, linear || matrix
					layout: 'linear'
				})
			})
			.match('*.{css,scss}', {
				// 开启图片压缩;
				useSprite: true,
				// css 压缩;
				optimizer: fis.plugin('clean-css')
			})

			.match('/components/{common,page,widget}/**.js', {
				isMod: true
			})
    	//TODO: lib中使用umd引入, 请在此加入;
			.match('/components/lib/{jquery,jquery.ui,slimscroll,highcharts,fabric,snap.svg,md5,swiper,socket,jplayer}/**.js', {
				isMod: true
			})

			.match('{*.js,*.vm:js,*.hbs:js,*.html:js}', {
				// js 压缩;
				optimizer: fis.plugin('uglify-js', {

				})
			})
      //TODO: 将已压缩的js排除, 会影响编译速度;
			.match('{highcharts,jplayer.blue.monday.min,*.min}.{js,css,scss}', {
				optimizer: false
			})

			.match('{/test/**,/doc/**,/server\.conf,/README.md}', {
				release: false
			})

			.match('**', {
				domain: static_domain,
				deploy: fis.plugin('local-deliver', {
					to: '/newGit/expressSS/myapp/public'
				})
			})
			.match('/views/(**.{vm,hbs,html})', {
				release: '$1',
				deploy: fis.plugin('local-deliver', {
					to: '/newGit/expressSS/myapp/views'
				})
			});

		// 不压缩处理;
		if ( '' === _val ) {
			fis.media( item.name )
				.match('*.{css,scss}', {
					optimizer: false
				})
				.match('{*.js,*.vm:js,*.html:js,*.hbs:js}', {
					optimizer: false
				});
		}

	});

});
