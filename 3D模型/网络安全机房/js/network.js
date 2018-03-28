var timer = null;
var ncount = 240;
var demo = {
	LAZY_MIN: 1000,
	LAZY_MAX: 6000,
	CLEAR_COLOR: '#39609B',
	RES_PATH: 'img',

	timer: null,

	getRes: function(file) {
		return demo.RES_PATH + '/' + file;
	},

	getEnvMap: function() {
		if(!demo.defaultEnvmap) {
			demo.defaultEnvmap = [];
			var image = demo.getRes('room.jpg');
			for(var i = 0; i < 6; i++) {
				demo.defaultEnvmap.push(image);
			}
		}
		return demo.defaultEnvmap
	},

	//all registered object creaters.
	_creators: {},

	//all registered object filters.
	_filters: {},

	//all registered shadow painters.
	_shadowPainters: {},

	registerCreator: function(type, creator) {
		this._creators[type] = creator;
	},

	getCreator: function(type) {
		return this._creators[type];
	},

	registerFilter: function(type, filter) {
		this._filters[type] = filter;
	},

	getFilter: function(type) {
		return this._filters[type];
	},

	registerShadowPainter: function(type, painter) {
		this._shadowPainters[type] = painter;
	},

	getShadowPainter: function(type) {
		return this._shadowPainters[type];
	},

	init: function(htmlElementId) {
		/*创建机房整体显示模块开始*/
		var div = document.getElementById('div');
		if(div) {
			document.body.removeChild(div);
		}
		div = document.createElement('div');
		div.setAttribute('id', 'div');
		
		div.innerHTML = "<div class='name' style='float:left'>机房名称：</div><div class='namecon'>网络安全机房</div>"+
						"<div class='name' style='float:left'>机柜数量：</div><div class='namecon'></div>"+
						"<div class='name' style='float:left'>设备总量：</div><div class='namecon'></div>"+
						"<div class='name' style='float:left'>报警数量：</div><div class='namecon'></div>"
		
		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.right = '20px';
		div.style.top = '20px';
		div.style.width = '510px';
		div.style.height = '100px';
		div.style.background = 'rgba(164,186,223,0.75)';
		div.style['border-radius'] = '5px';
		document.body.appendChild(div);

		/*创建机房整体显示模块结束*/
		var gl3dview = new mono.Gl3dview3D();
		demo.typeFinder = new mono.QuickFinder(gl3dview.getServa(), 'type', 'client');

		var interaction = new mono.DefaultInteraction(gl3dview);
		interaction.yLowerLimitAngle = Math.PI / 180 * 2;
		interaction.yUpLimitAngle = Math.PI / 2;
		interaction.maxDistance = 10000;
		interaction.minDistance = 50;
		interaction.zoomSpeed = 3;
		interaction.panSpeed = 0.2;
		//判断能不能向上转
		var editInteraction = new mono.EditInteraction(gl3dview);
		editInteraction.setShowHelpers(true);
		editInteraction.setScaleable(false);
		editInteraction.setRotateable(false);
		editInteraction.setTranslateable(true);

		gl3dview.setInteractions([interaction, new mono.SelectionInteraction(gl3dview), editInteraction]);

		gl3dview.isSelectable = function(element) {
			return gl3dview.moveView && element.getClient('type') === 'rack';
		};
		gl3dview.editableFunction = function(element) {
			return gl3dview.moveView && element.getClient('type') === 'rack';
		}
		document.getElementById(htmlElementId).appendChild(gl3dview.getRootView());


		var personLoaded = false;
		
		
		mono.Utils.autoAdjustGl3dviewBounds(gl3dview, document.documentElement, 'clientWidth', 'clientHeight');
		//鼠标双击方法
		gl3dview.getRootView().addEventListener('dblclick', function(e) {
			demo.handleDoubleClick(e, gl3dview);
		});
		//设置灯光
		demo.setupLights(gl3dview.getServa());
		gl3dview.getServa().getAlarmBox().addServaChangeListener(function(e) {
			var alarm = e.data;
			if(e.kind === 'add') {
				var node = gl3dview.getServa().getDataById(alarm.getElementId());
				node.setStyle('m.alarmColor', null);
			}
		});
		demo.loadData(gl3dview);
		demo.resetGleye(gl3dview);//初始图像所在的位置与偏移量

	},
	//初始图像所在的位置与偏移量
	resetGleye: function(gl3dview) {
		gl3dview.getGleye().setPosition(100, 2000, 3000);
		gl3dview.getGleye().lookAt(new mono.XiangliangThree(0, 0, 0));
	},
	
	dirtyShadowMap: function(gl3dview){
		var floor = gl3dview.getServa().shadowHost;
		var floorCombo = demo.typeFinder.findFirst('floorCombo');
		demo.updateShadowMap(floorCombo, floor, floor.getId(),gl3dview.getServa());
	},
	
	//设置灯光
	setupLights: function(box) {
		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(0, 1000, -800);
		box.add(pointLight);

		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(0, 1000, 800);
		box.add(pointLight);

		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(800, -800, 800);
		box.add(pointLight);

		box.add(new mono.AmbientLight('white'));
	},
	//鼠标双击方法
	handleDoubleClick: function(e, gl3dview) {
		var gleye = gl3dview.getGleye();
		var interaction = gl3dview.getDefaultInteraction();
		var firstClickObject = demo.findFirstObjectByMouse(gl3dview, e);
		if(firstClickObject) {
			var element = firstClickObject.element;
			var newTarget = firstClickObject.point;
			var oldTarget = gleye.getTarget();
			demo.animateGleye(gleye, interaction, oldTarget, newTarget, function() {
				if(element.getClient('animation')) {
					demo.playAnimation(element, element.getClient('animation'));
				}
			});
			if(element.getClient('dbl.func')) {
				var func = element.getClient('dbl.func');
				func();
			}
		} else {
			var oldTarget = gleye.getTarget();
			var newTarget = new mono.XiangliangThree(0, 0, 0);
			demo.animateGleye(gleye, interaction, oldTarget, newTarget);
		}
	},
	//复制属性
	copyProperties: function(from, to, ignores) {
		if(from && to) {
			for(var name in from) {
				if(ignores && ignores.indexOf(name) >= 0) {
					//ignore.
				} else {
					to[name] = from[name];
				}
			}
		}
	},
	//创建cube数据集对象
	createCubeObject: function(json) {
		var translate = json.translate || [0, 0, 0];
		var width = json.width;
		var height = json.height;
		var depth = json.depth;
		var sideColor = json.sideColor;
		var topColor = json.topColor;

		var object3d = new mono.Cube(width, height, depth);
		object3d.setPosition(translate[0], translate[1] + height / 2, translate[2]);
		object3d.s({
			'm.color': sideColor,
			'm.ambient': sideColor,
			'left.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
			'right.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'front.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'back.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
			'top.m.color': topColor,
			'top.m.ambient': topColor,
			'bottom.m.color': topColor,
			'bottom.m.ambient': topColor,
		});

		return object3d;
	},
	
	//二维视图构建
	create2DPath: function(pathData) {
		var path;
		for(var j = 0; j < pathData.length; j++) {
			var point = pathData[j];
			if(path) {
				path.lineTo(point[0], point[1], 0);
			} else {
				path = new mono.Path();
				path.moveTo(point[0], point[1], 0);
			}
		}

		return path;
	},
	//三维视图构建
	create3DPath: function(pathData) {
		var path;
		for(var j = 0; j < pathData.length; j++) {
			var point = pathData[j];
			if(path) {
				path.lineTo(point[0], point[1], point[2]);
			} else {
				path = new mono.Path();
				path.moveTo(point[0], point[1], point[2]);
			}
		}

		return path;
	},
	//创建Path数据集对象
	createPathObject: function(json) {
		var translate = json.translate || [0, 0, 0];
		var pathWidth = json.width;
		var pathHeight = json.height;
		var pathData = json.data;
		var path = this.create2DPath(pathData);
		var pathInsideColor = json.insideColor;
		var pathOutsideColor = json.outsideColor;
		var pathTopColor = json.topColor;

		var object3d = this.createWall(path, pathWidth, pathHeight, pathInsideColor, pathOutsideColor, pathTopColor);
		object3d.setPosition(translate[0], translate[1], -translate[2]);
		object3d.shadow = json.shadow;

		return object3d;
	
	},
	//滤波器json
	filterJson: function(box, objects) {
		var newObjects = [];

		for(var i = 0; i < objects.length; i++) {
			var object = objects[i];
			var type = object.type;
			var filter = this.getFilter(type);
			if(filter) {
				var filteredObject = filter(box, object);
				if(filteredObject) {
					if(filteredObject instanceof Array) {
						newObjects = newObjects.concat(filteredObject);
					} else {
						this.copyProperties(object, filteredObject, ['type']);
						newObjects.push(filteredObject);
					}
				}
			} else {
				newObjects.push(object);
			}
		}

		return newObjects;
	},
	//所有物件属性（包括单片机）
	createCombo: function(parts) {
		var children = [];
		var ops = [];
		var ids = [];
		for(var i = 0; i < parts.length; i++) {
			var object = parts[i];
			var op = object.op || '+';
			var style = object.style;
			var translate = object.translate || [0, 0, 0];
			var rotate = object.rotate || [0, 0, 0];
			if(object.ID){
				var ID = object.ID;
			}
			var object3d = null;
			if(object.type === 'path') {
				object3d = this.createPathObject(object);
			}
			if(object.type === 'cube') {
				object3d = this.createCubeObject(object);
			}
			if(object3d) {
				object3d.setRotation(rotate[0], rotate[1], rotate[2]);
				if(style) {
					object3d.s(style);
				}
				children.push(object3d);
				if(children.length > 1) {
					ops.push(op);
				}
				ids.push(object3d.getId());
			}
		}

		if(children.length > 0) {
			var combo = new mono.ComboNode(children, ops);
			combo.setNames(ids);
			combo.setNames(ID);
			return combo;
		}
		return null;
	},
	//构建图像方法
	loadData: function(gl3dview) {
		
		
		var json = demo.filterJson(gl3dview.getServa(), dataJson.objects);
		var box = gl3dview.getServa();

		gl3dview.setClearColor(demo.CLEAR_COLOR);

		var children = [];
		var ops = [];
		var ids = [];
		var shadowHost;
		var shadowHostId;
		for(var i = 0; i < json.length; i++) {
			var object = json[i];
			var op = object.op;
			var style = object.style;
			var client = object.client;
			var translate = object.translate || [0, 0, 0];
			var rotate = object.rotate || [0, 0, 0];
			var object3d = null;

			if(object.type === 'path') {
				object3d = this.createPathObject(object);
			}
			if(object.type === 'cube') {
				object3d = this.createCubeObject(object);
			}

			if(object.shadowHost) {
				shadowHost = object3d;
				shadowHostId = object3d.getId();
				box.shadowHost = shadowHost;
			}

			var creator = demo.getCreator(object.type);
			if(creator) {
				creator(box, object);
				continue;
			}

			if(object3d) {
				object3d.shadow = object.shadow;
				object3d.setRotation(rotate[0], rotate[1], rotate[2]);
				if(style) {
					object3d.s(style);
				}
				if(client) {
					for(var key in client) {
						object3d.setClient(key, client[key]);
					}
				}
				if(op) {
					children.push(object3d);
					if(children.length > 1) {
						ops.push(op);
					}
					ids.push(object3d.getId());
				} else {
					box.add(object3d);
				}
			}
		}

		if(children.length > 0) {
			var combo = new mono.ComboNode(children, ops);
			combo.setNames(ids);
			combo.setClient('type', 'floorCombo');
			box.add(combo);

		}
	},

	//机柜内所有储存设备的构建方法
	loadRackContent: function(box, x, y, z, width, height, depth, severity, cube, cut, json, parent, oldRack, numbera) {
		var serverTall = 9;
		var serverGap = 2;
		var findFaultServer = false;

		var numb = numbera.length;
		
		var num = json.label.slice(1) * 1;
		var numberlength = numbera[num].cabinetcon.length;
			
		for(var i = 0; i < numberlength; i++) {
			
			var number = numbera[num].cabinetcon[i].nubner * 1;
			
			var numbercon = numbera[num].cabinetcon[i];
			
			var ID = numbera[num].cabinetcon[i].ID;
			if(number==20||number==22){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-102.4;
			}
			if(number ==2||number ==5||number==101||number==30||number==40||number==50||number==51||number==53||number==60||number==80||number ==1){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-100.3;
			}
			if(number==41){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-98;
			}
			if(number ==4||number ==52||number ==57||number ==73||number ==76||number ==3){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-96;
			}
			if(number ==100){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-89;
			}
			if(number ==21||number ==82){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-78;
			}
			if(number ==211||number ==71){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-67;
			}
			if(number ==55){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-23;
			}
			if(number ==56){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-20;
			}
			if(number ==70){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-91.5;
			}
			if(number ==31){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-69;
			}
			if(number ==74||number ==81){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-90.5;
			}
			if(number ==75){
				var posi = numbera[num].cabinetcon[i].posi*(220/49)-87;
			}
			if(numbera[num].cabinetcon[i].correct=="false"){
				var m ="";
				 m = i;
			}
		
			var numberchild = numbera[num].cabinetcon[i].numberchild;
			
			var pic = 'server' + number + '.jpg';
			if(number === 100) {
				pic = 'server10.png';
			}
			if(number === 101) {
				pic = 'server2.png';
			}
			//错误机版变成红色
			var color = (i === m) ? severity.color : null;
			var server = this.createServer(box, cube, cut, pic, color, oldRack, json,numbercon,numberchild);

			var size = server.getBizBox().size();
			
			server.setPositionY(posi);
			server.setPositionZ(server.getPositionZ() + 5);
						
			server.setParent(parent);
		}
	},
	//机柜内储存的构建方法
	createServer: function(box, cube, cut, pic, color, oldRack, json,numbercon,numberchild) {
		var picMap = {
			'server1.jpg': 3 * 2,//2u 中科曙光服务器
			'server2.jpg': 3 * 2,//2u H3C 服务器
			'server2.png': 3 * 2,//2u 小刀服务器
			'server3.jpg': 3.7 * 4,//4u 华三数据库服务器
			'server4.jpg': 3.7 * 4,//4u 华为数据库服务器
			'server5.jpg': 3 * 2,//2u 华为服务器
			'server10.png': 4.7 * 6,//7u 竖服务器
			'server20.jpg': 2 * 1,//1u 交换机
			'server21.jpg': 8.4* 6,//12u 核心交换机
			'server22.jpg': 2 * 1,//1 u 光纤交换机
			'server30.jpg': 3 * 2,//2u 防火墙
			'server31.jpg':11.3* 6,//16u 防火墙
			'server40.jpg': 3 * 2,//2u 认证网管
			'server41.jpg': 3.445 * 3,//3u 认证网管
			'server50.jpg': 3 * 2,//2u 回溯分析 
			'server51.jpg': 3 * 2,//2u 流量清洗 流量监测
			'server52.jpg': 3.7 * 4,//4u 机架服务器
			'server53.jpg': 3 * 2,//2u 移动终端
			'server55.jpg': 27* 6,//37u 高端存储系统
			'server56.jpg': 27.9* 6,//38u 高端存储系统
			'server57.jpg': 3.7 * 4,//4u 存储系统
			'server60.jpg': 3 * 2,//2u 负载均衡器
			'server70.jpg': 3.9 * 6,//6u 传输设备
			'server71.jpg': 12.08* 6,//17u 传输设备
			'server73.jpg': 3.7 * 4,//4u 虚拟化网关
			'server74.jpg': 4.75 * 4,//5u 虚拟磁带库
			'server75.jpg': 8.1 * 4,//8u 虚拟磁带库
			'server76.jpg': 3.7 * 4,//4u 网络布线
			'server80.jpg': 3 * 2,//2u 路由器
			'server81.jpg': 4.75 * 4,//5u 路由器
			'server82.jpg': 8.4* 6,//12u 路由器
			'server211.jpg': 12.08* 6,//17u 核心交换机			
		}
		var ID = numbercon.ID;
		var x = cube.getPositionX();
		var z = cube.getPositionZ();
		var width = cut.getWidth();
		var height = picMap[pic];
		var depth = cut.getDepth();
		if(pic=="server2.png"){
			var serverBody = new mono.Cube(width - 2, height - 2, depth/4);
		}else{
			var serverBody = new mono.Cube(width - 2, height - 2, depth - 4);
		}
		
		
		
		var bodyColor = color ? color : '#5B6976';
		serverBody.s({
			'm.color': bodyColor,
			'm.ambient': bodyColor,
			'm.type': 'phong',
			'm.texture.image': demo.getRes('rack_inside.jpg'),
		});
		serverBody.setPosition(0, 0.5, (cube.getDepth() - serverBody.getDepth()) / 2);

		var serverPanel = new mono.Cube(width + 2, height + 1, 0.5);
		color = color ? color : '#FFFFFF';
		serverPanel.s({
			'm.texture.image': demo.getRes('rack_inside.jpg'),
			'front.m.texture.image': demo.RES_PATH + '/' + pic,
			'front.m.texture.repeat': new mono.XiangliangTwo(1, 1),
			'm.specularStrength': 100,
			'm.transparent': true,
			'm.color': color,
			'm.ambient': color,
		});
		serverPanel.setPosition(0, 0, serverBody.getDepth() / 2 + (cube.getDepth() - serverBody.getDepth()) / 2);

		var server = new mono.ComboNode([serverBody, serverPanel], ['+']);
		//横行片的弹缩
		server.setClient('animation', 'pullOut.z');
		server.setNames(ID);
		server.setPosition(0.5, 0, -5);

		box.add(server);

		if(pic == 'server10.png') {
			var isRendered = false;
			var xoffset = 2.1008,
				yoffset = 0.9897;
			var width = width + 2;
			var height = height + 1;
			var cardWidth = (width - xoffset * 2) / 14;
			var count = numberchild.length;
			//单片机排列方式
			for(var i = 0; i < count; i++) {
				var cardColor = '#FFFFFF';
				if(numberchild[i].correct == "false") {
					cardColor = "#FF0000";
				}
				var params = {
					'height': height - yoffset * 2,
					'width': cardWidth,
					'depth': depth * 0.4,
					"id": numberchild[i].ID,
					'pic': demo.RES_PATH + '/' + 'card' + numberchild[i].sime + '.png',
					'color': cardColor
				};

				var card = demo.createCard(params);
				box.add(card);

				card.setParent(server);
				card.setClient('type', 'card');
				card.setClient('isAlarm', cardColor != '#FFFFFF');
				card.p(-width / 2 + xoffset + (i + 0.5) * cardWidth, -height / 2 + yoffset, serverPanel.getPositionZ() - 1);
				card.setClient('animation', 'pullOut.z');

				if(card.getClient('isAlarm')) {
					oldRack.alarmCard = card;
				}
			}
		}
		return server;
	},
	//单片机属性 
	createCard: function(json) {
		var translate = json.translate || [0, 0, 0];
		var ID = json.id;
		var x = translate[0],
			y = translate[1],
			z = translate[2];
		var width = json.width || 10,
			height = json.height || 50,
			depth = json.depth || 50;
		var rotate = json.rotate || [0, 0, 0];
		var color = json.color || 'white';
		var pic = json.pic || demo.getRes('card1.png');

		var parts = [{
			//card panel
			type: 'cube',
			ID:ID,
			width: width,
			height: height,
			depth: 1,
			translate: [x, y, z + 1],
			rotate: rotate,
			op: '+',
			style: {
				'm.color': color,
				'm.ambient': color,
				'm.texture.image': demo.getRes('gray.png'),
				'front.m.texture.image': pic,
				'back.m.texture.image': pic,
			}
		}, {
			//card body
			type: 'cube',
			width: 1,
			height: height * 0.95,
			depth: depth,
			ID:ID,
			translate: [x, y, z - depth / 2 + 1],
			rotate: rotate,
			op: '+',
			style: {
				'm.color': color,
				'm.ambient': color,
				'm.texture.image': demo.getRes('gray.png'),
				'left.m.texture.image': demo.getRes('card_body.png'),
				'right.m.texture.image': demo.getRes('card_body.png'),
				'left.m.texture.flipX': true,
				'm.transparent': true,
				'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			}
		}];

		return demo.createCombo(parts);
	},

	findFirstObjectByMouse: function(gl3dview, e) {
		var objects = gl3dview.getElementsByMouseEvent(e);
		if(objects.length) {
			for(var i = 0; i < objects.length; i++) {
				var first = objects[i];
				var object3d = first.element;
				if(!(object3d instanceof mono.Billboard)) {
					return first;
				}
			}
		}
		return null;
	},

	animateGleye: function(gleye, interaction, oldPoint, newPoint, onDone) {
		//twaver.Util.stopAllAnimates(true);

		var offset = gleye.getPosition().sub(gleye.getTarget());
		var animation = new twaver.Animate({
			from: 0,
			to: 1,
			dur: 500,
			easing: 'easeBoth',
			onUpdate: function(value) {
				var x = oldPoint.x + (newPoint.x - oldPoint.x) * value;
				var y = oldPoint.y + (newPoint.y - oldPoint.y) * value;
				var z = oldPoint.z + (newPoint.z - oldPoint.z) * value;
				var target = new mono.XiangliangThree(x, y, z);
				gleye.lookAt(target);
				interaction.target = target;
				var position = new mono.XiangliangThree().addVectors(offset, target);
				gleye.setPosition(position);
			},
		});
		animation.onDone = onDone;
		animation.play();
	},
	/*点击时的动画方法*/
	playAnimation: function(element, animation, done) {
		var params = animation.split('.');
		//单片机缩放方法
		if(params[0] === 'pullOut') {
			var direction = params[1];
			demo.animatePullOut(element, direction, done);
		}
		if(params[0] === 'rotate') {
			var anchor = params[1];
			var angle = params[2];
			var easing = params[3];
			demo.animateRotate(element, anchor, angle, easing, done);
		}
	},
	/*点击时的动画方法1*/
	animatePullOut: function(object, direction, done) {
		//twaver.Util.stopAllAnimates(true);

		var size = object.getBizBox().size().multiply(object.getScale());

		var movement = 0.8;

		var directionVec = new mono.XiangliangThree(0, 0, 1);
		var distance = 0;
		if(direction === 'x') {
			directionVec = new mono.XiangliangThree(1, 0, 0);
			distance = size.x;
		}
		if(direction === '-x') {
			directionVec = new mono.XiangliangThree(-1, 0, 0);
			distance = size.x;
		}
		if(direction === 'y') {
			directionVec = new mono.XiangliangThree(0, 1, 0);
			distance = size.y;
		}
		if(direction === '-y') {
			directionVec = new mono.XiangliangThree(0, -1, 0);
			distance = size.y;
		}
		if(direction === 'z') {
			directionVec = new mono.XiangliangThree(0, 0, 1);
			distance = size.z;
		}
		if(direction === '-z') {
			directionVec = new mono.XiangliangThree(0, 0, -1);
			distance = size.z;
		}

		distance = distance * movement;
		if(object.getClient('animated')) {
			directionVec = directionVec.negate();
		}

		var fromPosition = object.getPosition().clone();
		object.setClient('animated', !object.getClient('animated'));

		new twaver.Animate({
			from: 0,
			to: 1,
			dur: 1000,
			easing: 'bounceOut',
			onUpdate: function(value) {
				//don't forget to clone new instance before use them!
				//储存器缩放方法
				object.setPosition(fromPosition.clone().add(directionVec.clone().multiplyScalar(distance * value)));
				
				if(value == 1){
					if(object.isfirst){
						object.isfirst = false;
					}else{
						var div = document.createElement('div');
						div.style['background'] = '#fff';
						if(object.names){
							/*div.innerHTML= object.names;*/
							var hmtl1 =" <div class='form_info'>" +
                "<div class='row2'><span class='title_blue'>基础信息</span></div>"+
						
										"<div class='row1'><span class='basename'>所属机柜：</span><span class='basecontent'>G1</span></div>" +
										"<div class='row1'><span class='basename1'>所属机房：</span><span class='basecontent1'>网络安全机房</span></div>"+
										"<div class='row1'><span class='basename1'>设备型号：</span><span class='basecontent1'>I620-G20</span></div>"+
										"<div class='row1'><span class='basename1'>设备类型：</span><span class='basecontent1'>服务器</span></div>"+
										"<div class='row1'><span class='basename1'>设备品牌：</span><span class='basecontent1'>中科曙光</span></div>"+
										"<div class='row1'><span class='basename2'>报警描述：</span><span class='basecontent2'>温度过高</span></div>"+
										
//										"<div style='clear:both'></div>"+
//										"<div class='shebeiss'>描述：<p>CPU：支持Intel Xeon E5-2600v4/v3系列多核处理器内存：24根内存插槽支持DDR42400/2133/1866 ECC内存硬盘：集成8口 SATA硬盘控制器，支持RAID 0、1、5可选八口SAS RAID卡，支持RAID 0/1/5/60/1/5/6系统最大支持12个热插拔3.5寸/24个2.5寸SAS/SATA硬盘，后置可支持4块硬盘I/O 扩展槽：最大可支持10个PCI-E扩展插槽(含2个专用PCI-E插槽)，可选支持高性能GPU（需搭配高功率电源）网络：可选集成双口RJ45千兆、双口RJ45万兆、四口RJ45千兆、双口光纤万兆网卡其他端口：1个RJ-45管理接口2前置个USB 3.0接口，2个后置USB3.0接口，1个VGA接口，1个串口电源：冗余电源，可选配支持BBU备份电池单元</p></div>"+
//										"<div style='clear:both'></div>"+
										"<div class='shebeiss'></div>"+"</div>"
							
									div.innerHTML= hmtl1;
									demo.showDialog(div, "描述", 400, 250);
						}
	
						object.isfirst = true;
					}
				}
			},
			onDone: function() {
				demo.animationFinished(object);

				if(done) {
					done();
				}
			},
		}).play();
	},
	/*点击时的动画方法2*/
	animateRotate: function(object, anchor, angle, easing, done) {
		//twaver.Util.stopAllAnimates(true);
		easing = easing || 'easeInStrong';

		var size = object.getBizBox().size().multiply(object.getScale());

		var from = 0;
		var to = 1;
		if(object.getClient('animated')) {
			to = -1;
		}
		object.setClient('animated', !object.getClient('animated'));

		var position;
		var axis;
		if(anchor === 'left') {
			position = new mono.XiangliangThree(-size.x / 2, 0, 0);
			var axis = new mono.XiangliangThree(0, 1, 0);
		}
		if(anchor === 'right') {
			position = new mono.XiangliangThree(size.x / 2, 0, 0);
			var axis = new mono.XiangliangThree(0, 1, 0);
		}

		var animation = new twaver.Animate({
			from: from,
			to: to,
			dur: 1500,
			easing: easing,
			onUpdate: function(value) {
				if(this.lastValue === undefined) {
					this.lastValue = 0;
				}
				object.rotateFromAxis(axis.clone(), position.clone(), Math.PI / 180 * angle * (value - this.lastValue));
				this.lastValue = value;
				
			},
			onDone: function() {
				delete this.lastValue;
				demo.animationFinished(object);

				if(done) {
					done();
				}
			},
		});
		animation.play();
	},

	animationFinished: function(element) {
		var animationDoneFuc = element.getClient('animation.done.func');
		if(animationDoneFuc) {
			animationDoneFuc();
		}
	},

	getRandomInt: function(max) {
		return parseInt(Math.random() * max);
	},

	getRandomLazyTime: function() {
		var time = demo.LAZY_MAX - demo.LAZY_MIN;
		return demo.getRandomInt(time) + demo.LAZY_MIN;
	},

	generateAssetImage: function(text) {
		var width = 512,
			height = 256;

		var canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		var ctx = canvas.getContext('2d');
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, width, height);

		ctx.font = 150 + 'px "Microsoft Yahei" bold';
		ctx.fillStyle = 'black';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(text, width / 2, height / 2);
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 15;
		ctx.strokeText(text, width / 2, height / 2);

		return canvas;
	},
	
	//弹框总方法
	showDialog: function(content, title, width, height) {
		
		title = title || '';
		width = width || 600;
		height = height || 400;
		var div = document.getElementById('dialog');
		if(div) {
			document.body.removeChild(div);
		}
		div = document.createElement('div');
		div.setAttribute('id', 'dialog');

		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.right = '20px';
		div.style.top = '180px';
		div.style.width = width + 'px';
		div.style.height = height + 'px';
		div.style.background = 'rgba(164,186,223,0.75)';
		div.style['border-radius'] = '5px';
		document.body.appendChild(div);

		var span = document.createElement('span');
		span.style.display = 'block';
		span.style['color'] = 'white';
		span.style['font-size'] = '13px';
		span.style.position = 'absolute';
		span.style.left = '10px';
		span.style.top = '2px';
		span.innerHTML = title;
		div.appendChild(span);

		var img = document.createElement('img');
		img.style.position = 'absolute';
		img.style.right = '4px';
		img.style.top = '4px';
		img.setAttribute('src', demo.getRes('close.png'));
		img.onclick = function() {
			document.body.removeChild(div);
			/*$(".addshebei").remove();*/
		};
		div.appendChild(img);

		if(content) {
			content.style.display = 'block';
			content.style.position = 'absolute';
			content.style.left = '3px';
			content.style.top = '24px';
			content.style.width = (width - 6) + 'px';
			content.style.height = (height - 26) + 'px';
			div.appendChild(content);
		}
	},
	
	//刷新
	resetView: function(gl3dview){		
		demo.resetGleye(gl3dview);

		//reset all racks. unload contents, close door.
		var loadedRacks=[];
		gl3dview.getServa().forEach(function(element){
			
			if(element.getClient('type')==='rack' && element.oldRack){
				loadedRacks.push(element);
			}
		});
		for(var i=0;i<loadedRacks.length;i++){
			//restore the old rack.
			var newRack=loadedRacks[i];
			var oldRack=newRack.oldRack;

			if(newRack.alarm){
				gl3dview.getServa().getAlarmBox().remove(newRack.alarm);
			}
			gl3dview.getServa().removeByDescendant(newRack,true);

			gl3dview.getServa().add(oldRack);
			if(oldRack.alarm){
				gl3dview.getServa().getAlarmBox().add(oldRack.alarm);
			}
			oldRack.door.setParent(oldRack);
			oldRack.setClient('loaded', false);
			
			//reset door.
			var door=oldRack.door;
			gl3dview.getServa().add(door);
			if(door.getClient('animated')){
				demo.playAnimation(door, door.getClient('animation'));
			}
		}

		//reset room door.
		var doors=[];
		gl3dview.getServa().forEach(function(element){
			if(element.getClient('type')==='left-door' || element.getClient('type')==='right-door'){
				doors.push(element);
			}
		});
		for(var i=0;i<doors.length;i++){
			var door=doors[i];
			if(door.getClient('animated')){
				demo.playAnimation(door, door.getClient('animation'));
			}
		}
		//reset all views.
		if(gl3dview.moveView){
			demo.toggleMoveView(gl3dview);
		}
	},


	resetRackPosition: function(gl3dview) {
		//reset all rack position
		gl3dview.getServa().forEach(function(element) {
			if(element.getClient('type') === 'rack') {
				element.setPosition(element.getClient('origin'));
			}
		});
	},
	//左侧菜单
	setupToolbar: function(buttons){		
		var count=buttons.length;
		var step=32;
		var div=document.createElement('div');
		div.setAttribute('id', 'toolbar');
		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.left = '10px';
		div.style.top = '75px';
		div.style.width='32px';
		div.style.height=(count*step+step)+'px';
		div.style.background='rgba(255,255,255,0.75)';						
		div.style['border-radius']='5px';
		document.body.appendChild(div);

		for(var i=0;i<count;i++){
			var button=buttons[i];
			var icon=button.icon;
			var img=document.createElement('img');
			img.style.position = 'absolute';
			img.style.left=  '4px';
			img.style.top = (step/2+(i * step))+'px';			
			img.style['pointer-events']='auto';
			img.style['cursor']='pointer';
			img.setAttribute('src', demo.getRes(icon));		
			img.style.width='24px';
			img.style.height='24px';
			img.setAttribute('title', button.label);
			img.onclick = button.clickFunction;
			div.appendChild(img);
		}
	},
	//拖拽机柜
	toggleMoveView: function(gl3dview){
		gl3dview.getServa().getSelectionContainer().clearSelection();
		gl3dview.moveView=!gl3dview.moveView;
		gl3dview.dirtyGl3dview();
		
	},
	//添加机柜方法
	addcabinetfunction: function(gl3dview) {
		
		for(var i=0;i<dataJson.objects.length;i++){
			if(dataJson.objects[i].type=="racks"){
				dataJson.objects[i].translates.push([-600, 0, 600]);
			}
		}
		demo.toggleMoveView(gl3dview);
		demo.loadData(gl3dview);
	},
	/*门禁信息弹框*/
	showDoorTable: function() {
		var div = document.createElement('div');
		div.style['background-color'] = 'rgba(255,255,255,0.85)';
		div.style['font-size'] = '12px';
		div.style['color'] = 'darkslategrey';
		div.style['overflow'] = 'auto';
		div.innerHTML = '<table style="width:100%">' +
			'<thead><tr><th>姓名</th><th>时间</th><th>信息</th></tr></thead>' +
			'<tbody>' +
			'<tr><td>张三</td><td>2017-02-01 8：00</td><td>进门</td></tr>' +
			'<tr><td>张三</td><td>2017-02-01 12：00</td><td>出门</td></tr>' +
			'<tr><td>张三</td><td>2017-02-01 13：00</td><td>进门</td></tr>' +
			'<tr><td>张三</td><td>2017-02-01 17：30</td><td>出门</td></tr>' +
			'<tr><td>李四</td><td>2017-02-01 8：00</td><td>进门</td></tr>' +
			'<tr><td>李四</td><td>2017-02-01 12：00</td><td>出门</td></tr>' +
			'<tr><td>李四</td><td>2017-02-01 13：00</td><td>进门</td></tr>' +
			'<tr><td>李四</td><td>2017-02-01 17：30</td><td>出门</td></tr>' +
			'</tbody></table>';
		demo.showDialog(div, "门禁信息", 510, 400);

	},
}
demo.registerFilter('floor', function(box, json) {
	return {
		type: 'cube',
		width: 1000,
		height: 10,
		depth: 1000,
		translate: [0, -10, 0],
		shadowHost: true,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.color': '#BEC9BE',
			'm.ambient': '#BEC9BE',
			'top.m.type': 'basic',
			'top.m.texture.image': demo.getRes('floor.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(10, 10),
			'top.m.color': '#DAF0F5',
			'top.m.polygonOffset': true,
			'top.m.polygonOffsetFactor': 3,
			'top.m.polygonOffsetUnits': 3,
		}
	};
});




demo.registerFilter('plants', function(box, json) {
	var objects = [];
	var translates = json.translates;
	if(translates) {
		for(var i = 0; i < translates.length; i++) {
			var translate = translates[i];
			var plant = {
				type: 'plant',
				shadow: true,
				translate: translate,
			};
			demo.copyProperties(json, plant, ['type', 'translates', 'translate']);
			objects.push(plant);
		}
	}
	return objects;
});

demo.registerFilter('racks', function(box, json) {
	var objects = [];
	var translates = json.translates;
	var severities = json.severities || [];
	var labels = json.labels || [];
	var numbers = json.numbers;
	
	if(translates) {
		for(var i = 0; i < translates.length; i++) {
			var translate = translates[i];
			var severity = severities[i];
			if(numbers[i]){
				var numberm = numbers[i].cabinetcon;
				var rackstate = numbers[i].rackstate;
			}
			//判断哪个机柜报警
			if(numberm) {
				for(var j = 0; j < numberm.length; j++) {
					if(numberm[j].nubner <= 2) {
						if(numberm[j].correct == "false") {
							severity = mono.AlarmSeverity.CRITICAL
						}
					}
					if(numberm[j].nubner==100){ 
						for(var m=0;m<numberm[j].numberchild.length;m++){
							if(numberm[j].numberchild[m].correct=="false"){
								severity = mono.AlarmSeverity.CRITICAL
							}
						}
					}
				}
			}
			var label = labels[i] || '';
			var rack = {
				type: 'rack',
				shadow: true,
				translate: translate,
				severity: severity,
				label: label,
			};
			demo.copyProperties(json, rack, ['type', 'translates', 'translate', 'severities']);
			objects.push(rack);
		}
	}

	return objects;
});

demo.registerFilter('wall', function(box, json) {
	var objects = [];

	var wall = {
		type: 'path',
		op: '+',
		width: 20,
		height: 330,
		shadow: true,
		insideColor: '#B8CAD5',
		outsideColor: '#A5BDDD',
		topColor: '#D6E4EC',
		translate: json.translate,
		data: json.data,

		client: {
			'data': json.data,
			'type': 'wall',
			'translate': json.translate,
		},
	};

	objects.push(wall);

	if(json.children) {
		var children = demo.filterJson(box, json.children);
		objects = objects.concat(children);
	}

	var comboChildren = [];
	var returnObjects = [];
	for(var i = 0; i < objects.length; i++) {
		var child = objects[i];
		if(child.op) {
			comboChildren.push(child);
		} else {
			returnObjects.push(child);
		}
	}

	var comboWall = demo.createCombo(comboChildren);
	comboWall.shadow = true;
	comboWall.setClient('data', json.data);
	comboWall.setClient('type', 'wall');
	comboWall.setClient('translate', json.translate);
	box.add(comboWall);

	return returnObjects;
});

demo.registerFilter('window', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 100,
		height = json.height || 100,
		depth = json.depth || 50;
	var glassDepth = 2;
	var platformHeight = 5,
		platformDepth = 45,
		platformOffsetZ = 10;
    var rotate = json.rotate || [0, 0, 0];
	return [{
		// window cut off
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		op: '-',
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',
		rotate: rotate,

	}, {
		//window glass
		type: 'cube',
		width: width - 0.5,
		height: height - 0.5,
		depth: glassDepth,
		translate: [x, y, z],
		op: '+',
		rotate: rotate,
		style: {
			'm.color': '#58ACFA',
			'm.ambient': '#58ACFA',
			'm.type': 'phong',
			'm.specularStrength': 0.1,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('rack_inside_normal.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(10, 5),
			'front.m.transparent': true,
			'front.m.opacity': 0.2,
			'back.m.transparent': true,
			'back.m.opacity': 0.2,
		},
	}, {
		//window bottom platform.
		type: 'cube',
		width: width,
		height: platformHeight,
		depth: platformDepth,
		translate: [x, y, z + platformOffsetZ],
		op: '+',
		sideColor: '#A5BDDD',
		topColor: '#D6E4EC',
		rotate: rotate,
	}];
});

demo.registerFilter('door', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 205,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;



	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		op: '+',
//		sideColor: '#C3D5EE',
//		topColor: '#D6E4EC',
	    
	}, {
		//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		op: '-',
		translate: [x, y + frameBottomEdge, z],
//		sideColor: '#B8CAD5',
//		topColor: '#D6E4EC',

	}, {
		//left door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		translate: [x - (width - frameEdge) / 4, frameBottomEdge + 1, z],
		//sideColor: 'orange',
		//topColor: 'orange',

		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_left.png'),
			'back.m.texture.image': demo.getRes('door_right.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.left.-90.bounceOut',
			'type': 'left-door',
		},
	}, {
		//right door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		translate: [x + (width - frameEdge) / 4, frameBottomEdge + 1, z],
//		sideColor: 'orange',
//		topColor: 'orange',
	
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_right.png'),
			'back.m.texture.image': demo.getRes('door_left.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.right.90.bounceOut',
			'type': 'right-door',
		},
	}, {
		//door control.
		type: 'cube',
		width: 15,
		height: 32,
		depth: depth - 3,
	
		translate: [x - width / 2 - 13, height * 0.6, z],
		style: {
			'left.m.visible': false,
			'right.m.visible': false,
			'top.m.visible': false,
			'bottom.m.visible': false,
			'm.transparent': true,
			'm.specularStrength': 50,
			'front.m.texture.image': demo.getRes('lock.png'),
			'back.m.texture.image': demo.getRes('lock.png'),
		},
		client: {
			'dbl.func': demo.showDoorTable,
			'type': 'door_lock',
		},
	}];
})


demo.registerFilter('door01', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 205,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;



	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		op: '+',
		sideColor: '#C3D5EE',
		topColor: '#D6E4EC',
	    
	}, {
		//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		op: '-',
		translate: [x, y + frameBottomEdge, z],
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',

	}, {
		//left door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		translate: [x - (width - frameEdge) / 4, frameBottomEdge + 1, z],
		//sideColor: 'orange',
		//topColor: 'orange',

		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_left.png'),
			'back.m.texture.image': demo.getRes('door_right.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.left.90.bounceOut',
			'type': 'left-door',
		},
	}, {
		//right door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		translate: [x + (width - frameEdge) / 4, frameBottomEdge + 1, z],
//		sideColor: 'orange',
//		topColor: 'orange',
	
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_right.png'),
			'back.m.texture.image': demo.getRes('door_left.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.right.-90.bounceOut',
			'type': 'right-door',
		},
	}, {
		//door control.
		type: 'cube',
		width: 15,
		height: 32,
		depth: depth - 3,
	
		translate: [x - width / 2 - 13, height * 0.6, z],
		style: {
			'left.m.visible': false,
			'right.m.visible': false,
			'top.m.visible': false,
			'bottom.m.visible': false,
			'm.transparent': true,
			'm.specularStrength': 50,
			'front.m.texture.image': demo.getRes('lock.png'),
			'back.m.texture.image': demo.getRes('lock.png'),
		},
		client: {
			'dbl.func': demo.showDoorTable,
			'type': 'door_lock',
		},
	}];
})
//UPS左右门








demo.registerFilter('backdoor', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 205,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;
   	var rotate = json.rotate || [0, 0, 0];
	

	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		op: '+',
		sideColor: '#C3D5EE',
		topColor: '#D6E4EC',
		rotate:rotate,


	}, {
		//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		op: '-',
		translate: [x, y + frameBottomEdge, z],
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',
		rotate:rotate,

	}, {
		//left door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		translate: [-1300, 0, 995],
		//sideColor: 'orange',
		//topColor: 'orange',
		rotate:rotate,

		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_left.png'),
			'back.m.texture.image': demo.getRes('door_right.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.left.90.bounceOut',
			'type': 'left-door',
		},
	}, {
		//right door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		translate: [-1300, 0, 900],
//		sideColor: 'orange',
//		topColor: 'orange',
		rotate:rotate,
	
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_right.png'),
			'back.m.texture.image': demo.getRes('door_left.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.right.-90.bounceOut',
			'type': 'right-door',
			rotate:rotate,
		},

	}];
})

//备用门左右门


demo.registerFilter('backdoor_cut', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 205,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;
   	var rotate = json.rotate || [0, 0, 0];
	

	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		op: '+',
		sideColor: '#C3D5EE',
		topColor: '#D6E4EC',
		rotate:rotate,},
	{//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		op: '-',
		translate: [x, y + frameBottomEdge, z],
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',
		rotate:rotate,
	}];
})







//门隔断门
demo.registerFilter('rackdoor2', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 205,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;
	var rotate = json.rotate || [0, 0, 0];

	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		rotate:rotate,
		op: '+',
		sideColor: '#1E2C2A',
		topColor: '#1E2C2A',
	}, {
		//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		rotate:rotate,
		op: '-',
		translate: [x, 102, z],
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',
	}, {
		//left door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		rotate:rotate,
		translate: [x - (width - frameEdge) / 4, 103, z],
		//sideColor: 'orange',
		//topColor: 'orange',
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_left.png'),
			'back.m.texture.image': demo.getRes('door_right.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.left.90.bounceOut',
			'type': 'left-door',
		},
	}, {
		//right door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		rotate:rotate,
		translate: [x + (width - frameEdge) / 4,103, z],
		//sideColor: 'orange',
		//topColor: 'orange',
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_right.png'),
			'back.m.texture.image': demo.getRes('door_left.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.right.-90.bounceOut',
			'type': 'right-door',
		},
	}];
});

demo.registerFilter('rackdoor', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 205,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;
	var rotate = json.rotate || [0, 0, 0];

	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		rotate:rotate,
		op: '+',
		sideColor: '#1E2C2A',
		topColor: '#1E2C2A',
	}, {
		//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		rotate:rotate,
		op: '-',
		translate: [x, 102, z],
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',
	}, {
		//left door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		rotate:rotate,
		translate: [x - (width - frameEdge) / 4, 103, z],
		//sideColor: 'orange',
		//topColor: 'orange',
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_left.png'),
			'back.m.texture.image': demo.getRes('door_right.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.left.-90.bounceOut',
			'type': 'left-door',
		},
	}, {
		//right door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		rotate:rotate,
		translate: [x + (width - frameEdge) / 4,103, z],
		//sideColor: 'orange',
		//topColor: 'orange',
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_right.png'),
			'back.m.texture.image': demo.getRes('door_left.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.right.90.bounceOut',
			'type': 'right-door',
		},
	}];
});

//入口VIP大门
demo.registerFilter('rackdoor1', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 410,
		height = json.height || 180,
		depth = json.depth || 26;
	var frameEdge = 10,
		frameBottomEdge = 2;
	var rotate = json.rotate || [0, 0, 0];

	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		rotate:rotate,
		op: '+',
		sideColor: '#1E2C2A',
		topColor: '#1E2C2A',
	}, {
		//door cut off.
		type: 'cube',
		width: width - frameEdge,
		height: height - frameEdge / 2 - frameBottomEdge,
		depth: depth + 2,
		rotate:rotate,
		op: '-',
		translate: [x, 102, z],
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',
	}, {
		//left door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		rotate:rotate,
		translate: [x + (width - frameEdge) / 4,103, z],
		//sideColor: 'orange',
		//topColor: 'orange',
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_left1.png'),
			'back.m.texture.image': demo.getRes('door_right1.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.left.-90.bounceOut',
			'type': 'left-door',
		},
	}, {
		//right door.
		type: 'cube',
		width: (width - frameEdge) / 2 - 2,
		height: height - frameEdge / 2 - frameBottomEdge - 2,
		depth: 2,
		rotate:rotate,
		translate: [x - (width - frameEdge) / 4, 103, z],
		//sideColor: 'orange',
		//topColor: 'orange',
		style: {
			'm.type': 'phong',
			'm.transparent': true,
			'front.m.texture.image': demo.getRes('door_right.png'),
			'back.m.texture.image': demo.getRes('door_left.png'),
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('white.png'),
		},
		client: {
			'animation': 'rotate.right.90.bounceOut',
			'type': 'right-door',
		},
	}];
});
demo.registerFilter('glass_wall', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 100,
		height = json.height || 300,
		depth = json.depth || 20;
	var glassHeight = height * 0.6;
	var rotate = json.rotate || [0, 0, 0];

	var parts = [{
		//wall body.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		shadow: true,
		translate: [x, y, z],
		rotate: rotate,
		op: '+',
		sideColor: '#A5BDDD',
		topColor: '#D6E4EC',
	}, {
		//wall middle cut off
		type: 'cube',
		width: width + 2,
		height: glassHeight,
		depth: depth + 2,
		translate: [x, (height - glassHeight) / 3 * 2, z],
		rotate: rotate,
		op: '-',
		sideColor: '#A5BDDD',
		topColor: '#D6E4EC',
	}, {
		//wall middle glass.
		type: 'cube',
		width: width,
		height: glassHeight,
		depth: 4,
		translate: [x, (height - glassHeight) / 3 * 2, z],
		rotate: rotate,
		op: '+',
		sideColor: '#58ACFA',
		topColor: '#D6E4EC',
		style: {
			'm.transparent': true,
			'm.opacity': 0.6,
			'm.color': '#01A9DB',
			'm.ambient': '#01A9DB',
			'm.type': 'phong',
			'm.specularStrength': 100,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('rack_inside_normal.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(30, 5),
		},
	}];

	var wall = demo.createCombo(parts);
	wall.setClient('type', 'glassWall');
	wall.setClient('size', wall.getBizBox().size());
	wall.setClient('translate', translate);
	wall.shadow = true;
	box.add(wall);
});

demo.registerShadowPainter('wall', function(object, context, floorWidth, floorHeight, translate, rotate) {
	var translate = object.getClient('translate') || [0, 0, 0];
	var translateX = floorWidth / 2 + translate[0];
	var translateY = floorHeight - (floorHeight / 2 + translate[2]);
	var pathData = object.getClient('data');

	context.save();
	context.translate(translateX, translateY);
	context.rotate(rotate);
	context.beginPath();
	var first = true;
	for(var j = 0; j < pathData.length; j++) {
		var point = pathData[j];
		if(first) {
			context.moveTo(point[0], -point[1]);
			first = false;
		} else {
			context.lineTo(point[0], -point[1]);
		}
	}

	context.lineWidth = object.getClient('width') || 20;

	context.strokeStyle = 'white';
	context.shadowColor = '#222222';
	context.shadowBlur = 60;
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.stroke();

	context.restore();
});




demo.registerShadowPainter('rack', function(object, context, floorWidth, floorHeight, translate, rotate) {
	var translateX = floorWidth / 2 + translate.x;
	var translateY = floorHeight / 2 + translate.z;
	var width = object.width || 60;
	var height = object.height || 200;
	var depth = object.depth || 80;
	var width = width * 0.99;
	var lineWidth = depth * 0.99;

	context.save();

	context.beginPath();
	context.moveTo(translateX - width / 2, translateY);
	context.lineTo(translateX + width / 2, translateY);

	context.lineWidth = lineWidth;
	context.strokeStyle = 'gray';
	context.shadowColor = 'black';
	context.shadowBlur = 100;
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.stroke();

	context.restore();
});

demo.createRoundShadowPainter = function(radius) {
	return function(object, context, floorWidth, floorHeight, translate, rotate) {
		var translateX = floorWidth / 2 + translate.x;
		var translateY = floorHeight / 2 + translate.z;

		context.save();

		context.beginPath();
		context.arc(translateX, translateY, radius, 0, 2 * Math.PI, false);

		context.fillStyle = 'black';
		context.shadowColor = 'black';
		context.shadowBlur = 25;
		context.shadowOffsetX = 0;
		context.shadowOffsetY = 0;
		context.fill();

		context.restore();
	}
};

demo.registerShadowPainter('plant', demo.createRoundShadowPainter(11));
/*demo.registerShadowPainter('extinguisher', demo.createRoundShadowPainter(7));*/

demo.registerShadowPainter('glassWall', function(object, context, floorWidth, floorHeight, translate, rotate) {
	var translate = object.getClient('translate');
	var size = object.getClient('size');
	var translateX = floorWidth / 2 + translate[0];
	var translateY = floorHeight / 2 + translate[2];
	var width = size.x;
	var lineWidth = size.z;
	context.save();

	context.translate(translateX, translateY);

	context.beginPath();
	context.moveTo(-width / 2, 0);
	context.lineTo(width / 2, 0);

	context.lineWidth = lineWidth;
	context.strokeStyle = 'white';
	context.shadowColor = '#222222';
	context.shadowBlur = 60;
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.stroke();

	context.restore();
});


demo.registerFilter('window', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 100,
		height = json.height || 100,
		depth = json.depth || 50;
	var glassDepth = 2;
	var platformHeight = 5,
		platformDepth = 45,
		platformOffsetZ = 10;

	return [{
		// window cut off
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		translate: [x, y, z],
		op: '-',
		sideColor: '#B8CAD5',
		topColor: '#D6E4EC',

	}, {
		//window glass
		type: 'cube',
		width: width - 0.5,
		height: height - 0.5,
		depth: glassDepth,
		translate: [x, y, z],
		op: '+',
		style: {
			'm.color': '#58ACFA',
			'm.ambient': '#58ACFA',
			'm.type': 'phong',
			'm.specularStrength': 0.1,
			'm.envmap.image': demo.getEnvMap(),
			'm.specularmap.image': demo.getRes('rack_inside_normal.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(10, 5),
			'front.m.transparent': true,
			'front.m.opacity': 0.4,
			'back.m.transparent': true,
			'back.m.opacity': 0.4,
		},
	}, {
		//window bottom platform.
		type: 'cube',
		width: width,
		height: platformHeight,
		depth: platformDepth,
		translate: [x, y, z + platformOffsetZ],
		op: '+',
		sideColor: '#A5BDDD',
		topColor: '#D6E4EC',
	}];
});






//储备片机柜尺寸
demo.registerCreator('rack', function(box, json) {

	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	
	var width = json.width || 70;//机柜实际尺寸70
	var height = json.height || 220;//机柜实际尺寸200
	var severity = json.severity;
	var depth = json.depth ||85;//机柜实际尺寸110
	var rotate = json.rotate;
	var label = json.label;
	var shadow = json.shadow;
	var numbera = json.numbers;
	//获取机柜ID
	if(numbera[label.slice(1) * 1]){
		var cabinetid = numbera[label.slice(1) * 1].cabinetid;
		var angle = numbera[label.slice(1) * 1].angle || 0;
		var rackstate = numbera[label.slice(1) * 1].rackstate ||"";
	}
	
	
	var rack = new mono.Cube(width, height, depth);
	  if (rackstate == "free") {
        rack.s({
            'm.color': '#2a3e3c',
            'm.ambient': '#0dffbd',
        })
    }
    else if (rackstate == "power") {
        rack.s({
            'm.color': '#0BB9DF',
            'm.ambient': '#0BB9DF'
        })
    }
    else if (rackstate == "trusteeship") {
        rack.s({
            'm.color': '#E3E5D4',
            'm.ambient': '#E3E5D4'
        })
    }
    else if (rackstate == "") {
        rack.s({
            'm.color': '#557E7A',
            'm.ambient': '#557E7A'
        })
    }
	rack.s({
		/*'m.color': '#557E7A',*/
		'left.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
		'right.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
		'front.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
		'back.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
		'top.m.normalmap.image': demo.getRes('metal_normalmap.jpg'),
		'left.m.normalmap.image': demo.getRes('metal_normalmap.jpg'),
		'right.m.normalmap.image': demo.getRes('metal_normalmap.jpg'),
		'back.m.normalmap.image': demo.getRes('metal_normalmap.jpg'),
		'top.m.specularmap.image': demo.getRes('outside_lightmap.jpg'),
		'left.m.specularmap.image': demo.getRes('outside_lightmap.jpg'),
		'right.m.specularmap.image': demo.getRes('outside_lightmap.jpg'),
		'back.m.specularmap.image': demo.getRes('outside_lightmap.jpg'),
		'top.m.envmap.image': demo.getEnvMap(),
		'left.m.envmap.image': demo.getEnvMap(),
		'right.m.envmap.image': demo.getEnvMap(),
		'back.m.envmap.image': demo.getEnvMap(),
		/*'m.ambient': '#557E7A',*/
		'm.type': 'phong',
		'm.specularStrength': 50,
		'front.m.texture.image': demo.getRes('rack.jpg'),
		'front.m.texture.repeat': new mono.XiangliangTwo(1, 1),
		'front.m.specularmap.image': demo.getRes('white.png'),
		'front.m.color': '#666',
		'front.m.ambient': '#666',
		'front.m.specularStrength': 200,
	});
	rack.setPosition(x, height / 2 + 1 + y, z);

	var labelCanvas = demo.generateAssetImage(label);
	rack.setStyle('top.m.texture.image', labelCanvas);
	rack.setStyle('top.m.specularmap.image', labelCanvas);
	rack.setClient('type', 'rack');
	rack.setClient('origin', rack.getPosition().clone());
	rack.setClient('loaded', false);
	rack.shadow = shadow;
	
	rack.setRotation(Math.PI / 180, Math.PI / 180 * angle, 0);
	
	rack.setClient('dbl.func', function() {
		var div = document.createElement('div');
		div.style['background-color'] = 'rgba(255,255,255,0.85)';
		div.style['font-size'] = '12px';
		div.style['color'] = 'darkslategrey';
		/*div.innerHTML = cabinetid;*/
		var html1 = " <div class='form_info'>" +
                "<div class='row2'><span class='title_blue'>机柜信息</span></div>"+
		"<div class='row1'><span class='basename'>所属机房：</span><span class='basecontent'>网络安全机房</span></div>"+
					"<div class='row1'><span class='basename1'>所属机柜：</span><span class='basecontent1'>G系类</span></div>"+
					"<div></div>"
		
		div.innerHTML = html1;		
		
		demo.showDialog(div, "描述！", 400,250);

	});

	var rackDoor = new mono.Cube(width, height, 2);
	if(rackstate=="free"){
		rackDoor.s({
			'm.type': 'phong',
			 'm.color': '#2a3e3c',
            'm.ambient': '#0dffbd',
			'front.m.texture.image': demo.getRes('rack_front_door.jpg'),
			'back.m.texture.image': demo.getRes('rack_door_back.jpg'),
			'm.envmap.image': demo.getEnvMap(),
		});
	}
	if(rackstate=="power"){
		rackDoor.s({
			'm.type': 'phong',
			'm.color': '#067e98',
			'm.ambient': '#a0d5d7',
			'front.m.texture.image': demo.getRes('rack_front_door.jpg'),
			'back.m.texture.image': demo.getRes('rack_door_back.jpg'),
			'm.envmap.image': demo.getEnvMap(),
		});
	}
	if(rackstate==""){
		rackDoor.s({
			'm.type': 'phong',
			'm.color': '#A5F1B5',
			'm.ambient': '#A4F4EC',
			'front.m.texture.image': demo.getRes('rack_front_door.jpg'),
			'back.m.texture.image': demo.getRes('rack_door_back.jpg'),
			'm.envmap.image': demo.getEnvMap(),
		});
	}
	
	
	rackDoor.setParent(rack);
	rack.door = rackDoor;
	rackDoor.setPosition(0, 0, depth / 2 + 1);
	
	rackDoor.setClient('animation', 'rotate.right.100');
	
	rackDoor.setClient('type', 'rack.door');
	rackDoor.setClient('animation.done.func', function() {
		if(rack.getClient('loaded') || !rackDoor.getClient('animated')) {
			return;
		}
		var fake = rack.clone();
		fake.s({
			'm.color': 'red',
			'm.ambient': 'red',
			'top.m.normalmap.image': demo.getRes('outside_lightmap.jpg'),
			'top.m.specularmap.image': demo.getRes('white.png'),
		});
		fake.setDepth(fake.getDepth() - 2);
		fake.setWidth(fake.getWidth() - 2);
		box.add(fake);

		rack.s({
			'm.transparent': true,
			'm.opacity': 0.5,
		});

		new twaver.Animate({
			from: 0,
			to: fake.getHeight(),
			dur: 1000,
			easing: 'easeOut',
			onUpdate: function(value) {
				fake.setHeight(value);
				fake.setPositionY(value / 2);
			},
			onDone: function() {
				box.remove(fake);
				rack.s({
					'm.transparent': false,
					'm.opacity': 1,
				});
				var loader = rack.getClient('rack.loader');
				if(loader && rackDoor.getClient('animated') && !rack.getClient('loaded')) {
					loader();
					rack.setClient('loaded', true);

					if(rack.getClient('loaded.func')) {
						rack.getClient('loaded.func')(rack);
					}
				}
			}
		}).play();
	});

	var loader = function(box, width, height, depth, severity, rack, json) {
		var cut = new mono.Cube(width * 0.75, height - 10, depth);
		cut.s({
			'm.color': '#333333',
			'm.ambient': '#333333',
			'm.lightmap.image': demo.getRes('inside_lightmap.jpg'),
			'bottom.m.texture.repeat': new mono.XiangliangTwo(2, 2),
			'left.m.texture.image': demo.getRes('rack_panel.jpg'),
			'right.m.texture.image': demo.getRes('rack_panel.jpg'),
			'back.m.texture.image': demo.getRes('rack_panel.jpg'),
			'back.m.texture.repeat': new mono.XiangliangTwo(1, 1),
			'top.m.lightmap.image': demo.getRes('floor.jpg'),
		});
		cut.setPosition(0, 0, depth / 2 - cut.getDepth() / 2 + 1);
		
		box.remove(rack);
		if(rack.alarm) {
			box.getAlarmBox().remove(rack.alarm);
		}

		var cube = rack.clone();
		cube.p(0, 0, 0);
		cube.setRotation(0, 0, 0)
		var newRack = new mono.ComboNode([cube, cut], ['-']);
		newRack.setRotation(Math.PI / 180, Math.PI / 180 * angle, 0);
		var x = rack.getPosition().x;
		var y = rack.getPosition().y;
		var z = rack.getPosition().z;

		newRack.p(x, y, z);
		newRack.setClient('type', 'rack');
		newRack.oldRack = rack;
		rack.newRack = newRack;
		newRack.setClient('dbl.func', function() {
			var div = document.createElement('div');
			div.style['background-color'] = 'rgba(255,255,255,0.85)';
			div.style['font-size'] = '12px';
			div.style['color'] = 'darkslategrey';
			/*div.innerHTML = cabinetid;*/
			var html1 = " <div class='form_info'>" +
                "<div class='row2'><span class='title_red'>告警信息：共2个</span></div>"+
		"<div class='row1'><span class='basename'>所属机房：</span><span class='basecontentjg'>网络安全机房</span></div>"+
					"<div class='row1'><span class='basename'>所属机柜：</span><span class='basecontent2'>G系类</span></div>"+
					"<div></div>"
		
			div.innerHTML = html1
			demo.showDialog(div, "警告！", 400,250);
		})
		newRack.shadow = shadow;
		box.add(newRack);

		if(severity) {
			var alarm = new mono.Alarm(newRack.getId(), newRack.getId(), severity);
			newRack.setStyle('alarm.billboard.vertical', true);
			newRack.alarm = alarm;
			box.getAlarmBox().add(alarm);
		}

		//set child for newrack
		var children = rack.getChildren();
		children.forEach(function(child) {
			if(child && !(child instanceof mono.Billboard)) {
				child.setParent(newRack);
			}
		});

		demo.loadRackContent(box, x, y, z, width, height, depth, severity, cube, cut, json, newRack, rack, numbera);
	};

	box.add(rack);
	box.add(rackDoor);

	if(severity) {
		var alarm = new mono.Alarm(rack.getId(), rack.getId(), severity);
		rack.setStyle('alarm.billboard.vertical', true);
		rack.alarm = alarm;
		box.getAlarmBox().add(alarm);
	}

	var loadFunction = function() {
		loader(box, width, height, depth, severity, rack, json);
	};
	rack.setClient('rack.loader', loadFunction);
});

demo.registerCreator('plant', function(box, json) {
	var scale = json.scale || [1, 1, 1];
	var scaleX = scale[0],
		scaleY = scale[1],
		scaleZ = scale[2];
	var shadow = json.shadow;
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];

	var loader = function(x, y, z, scaleX, scaleY, scaleZ) {
		var plant = demo.createPlant(x, y, z, scaleX, scaleY, scaleZ);
		plant.shadow = shadow;
		box.add(plant);
	};

	var loaderFunc = function(x, y, z, scaleX, scaleY, scaleZ) {
		return function() {
			loader(x, y, z, scaleX, scaleY, scaleZ);
		};
	};
	setTimeout(loaderFunc(translate[0], translate[1], translate[2], scale[0], scale[1], scale[2]), demo.getRandomLazyTime());
});

demo.registerCreator('tv', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var edgeX = 4,
		edgeY = 2;
	var rotate = json.rotate || [0, 0, 0];

	var parts = [{
		//tv body
		type: 'cube',
		width: 150,
		height: 80,
		depth: 5,
		translate: [x, y, z],
		rotate: rotate,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.color': '#2D2F31',
			'm.ambient': '#2D2F31',
			'm.normalmap.image': demo.getRes('metal_normalmap.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(10, 6),
			'm.specularStrength': 20,
		},
	}, {
		//'tv cut off',
		type: 'cube',
		width: 130,
		height: 75,
		depth: 5,
		translate: [x, y + edgeY, z + edgeX],
		rotate: rotate,
		op: '-',
		style: {
			'm.type': 'phong',
			'm.color': '#2D2F31',
			'm.ambient': '#2D2F31',
			'm.normalmap.image': demo.getRes('metal_normalmap.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(10, 6),
			'm.specularStrength': 100,
		},
	}, 	{//'tv screen',
		type: 'cube',
		width: 130,
		height: 75,
		depth: 1,
		translate: [x, y + edgeY, z + 1.6],
		rotate: rotate,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.specularStrength': 200,
			'front.m.texture.image': picture,
		},
	}];

	var tv = demo.createCombo(parts);
	tv.setClient('type', 'tv');
	tv.setClient('dbl.func', function() {
		var video = document.createElement('iframe');
		video.setAttribute('src', demo.getRes("../iframe.html"));
		video.style['overflow'] = 'auto';
		demo.showDialog(video, "图标信息", 510, 450);
	});
	box.add(tv);
});
demo.createWall = function(path, thick, height, insideColor, outsideColor, topColor) {
	var wall = new mono.PathCube(path, thick, height);
	wall.s({
		'outside.m.color': outsideColor,
		'inside.m.type': 'basic',
		'inside.m.color': insideColor,
		'aside.m.color': outsideColor,
		'zside.m.color': outsideColor,
		'top.m.color': topColor,
		'bottom.m.color': topColor,
		'inside.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
		'outside.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
		'aside.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
		'zside.m.lightmap.image': demo.getRes('outside_lightmap.jpg'),
	});
	return wall;
}







demo.createPlant = function(x, y, z, scaleX, scaleY, scaleZ) {
	var plant;
	if(!demo._plantInstance) {
		var w = 30;
		var h = 120;
		var pic = demo.getRes('plant.png');
		var objects = [];

		var cylinderVase = new mono.Cylinder(w * 0.6, w * 0.4, h / 5, 20, 1, false, false);
		cylinderVase.s({
			'm.type': 'phong',
			'm.color': '#845527',
			'm.ambient': '#845527',
			'm.texture.repeat': new mono.XiangliangTwo(10, 4),
			'm.specularmap.image': demo.getRes('metal_normalmap.jpg'),
			'm.normalmap.image': demo.getRes('metal_normalmap.jpg'),
		});
		var cylinderHollow = cylinderVase.clone();
		cylinderHollow.setScale(0.9, 1, 0.9);
		var cylinderMud = cylinderHollow.clone();
		cylinderMud.setScale(0.9, 0.7, 0.9);
		cylinderMud.s({
			'm.type': 'phong',
			'm.color': '#163511',
			'm.ambient': '#163511',
			'm.texture.repeat': new mono.XiangliangTwo(10, 4),
			'm.specularmap.image': demo.getRes('metal_normalmap.jpg'),
			'm.normalmap.image': demo.getRes('metal_normalmap.jpg'),
		});
		var vase = new mono.ComboNode([cylinderVase, cylinderHollow, cylinderMud], ['-', '+']);
		objects.push(vase);

		var count = 5;
		for(var i = 0; i < count; i++) {
			var plant = new mono.Cube(w * 2, h, 0.01);

			plant.s({
				'm.visible': false,
				'm.alphaTest': 0.5,
				'front.m.visible': true,
				'front.m.texture.image': pic,
				'back.m.visible': true,
				'back.m.texture.image': pic,
			});
			plant.setParent(vase);
			plant.setPositionY(cylinderVase.getHeight() / 2 + plant.getHeight() / 2 - 3);
			plant.setRotationY(Math.PI * i / count);
			objects.push(plant);
		}

		demo._plantInstance = new mono.ComboNode(objects);
		demo._plantInstance.setClient('plant.original.y', cylinderVase.getHeight() / 2);
		plant = demo._plantInstance;
		//console.log('create plant from brand new');
	} else {
		plant = demo._plantInstance.clone();
		//console.log('create plant from instance');
	}

	plant.setPosition(x, plant.getClient('plant.original.y') + y, z);
	plant.setScale(scaleX, scaleY, scaleZ);
	plant.setClient('type', 'plant');
	return plant;
}
demo.registerFilter('floor_cut', function(box, json){
	return {
		type: 'cube',
		width: 100,
		height: 100,
		depth: 100,
		op: '-',
		style: {
			'm.texture.image': demo.getRes('floor.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(4,4),
			'm.color': '#DAF0F5',
			'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'm.polygonOffset':true,
			'm.polygonOffsetFactor':3,
			'm.polygonOffsetUnits':3,
			
		}
	};
});


demo.registerFilter('floor_cuts', function(box, json){
	var angle= json.angle;
	return {
		type: 'cube',
		width: 100,
		height: 100,
		depth: 100,
		op: '+',
		style: {
			'm.texture.image': demo.getRes('floor.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(4,4),
			'm.color': '#DAF0F5',
			'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'm.polygonOffset':true,
			'm.polygonOffsetFactor':3,
			'm.polygonOffsetUnits':3,
			angle:angle,
			
		}
	};
});


demo.registerFilter('floor_cut2', function(box, json){
	var rotate = json.rotate || [0, 0, 0];
	return {
		type: 'cube',
		width: 100,
		height: 100,
		depth: 100,
		op: '-',
		style: {
			'm.texture.image': demo.getRes('floor.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(4,4),
			'm.color': '#DAF0F5',
			'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'm.polygonOffset':true,
			'm.polygonOffsetFactor':3,
			'm.polygonOffsetUnits':3,
		rotate:rotate,		
		}
	};
});

demo.registerFilter('floor_cuts2', function(box, json){
	var angle= json.angle;
    var rotate = json.rotate || [0, 0, 0];
	return {
		type: 'cube',
		width: 100,
		height: 100,
		depth: 100,
		op: '+',
		style: {
			'm.texture.image': demo.getRes('floor.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(4,4),
			'm.color': '#DAF0F5',
			'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'm.polygonOffset':true,
			'm.polygonOffsetFactor':3,
			'm.polygonOffsetUnits':3,
			rotate:rotate,		
		}
	};
});

demo.registerFilter('floors', function(box, json) {
	var width = json.width || 0;
	var height = json.height||0;
	var depth = json.depth||0;
	var translate = json.translate;
	return {
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		shadowHost: true,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.color': '#BEC9BE',
			'm.ambient': '#BEC9BE',
			'top.m.type': 'basic',
			/*'top.m.texture.image': demo.getRes('floor1.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(15, 10),*/
			'top.m.texture.image': demo.getRes('floor.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(10, 10),
			'top.m.color': '#DAF0F5',
			'top.m.polygonOffset': true,
			'top.m.polygonOffsetFactor': 3,
			'top.m.polygonOffsetUnits': 3,
		}
	};
});

demo.registerFilter('floors01', function(box, json) {
	var width = json.width || 0;
	var height = json.height||0;
	var depth = json.depth||0;
	var translate = json.translate;
	return {
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		shadowHost: true,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.color': '#BEC9BE',
			'm.ambient': '#BEC9BE',
			'top.m.type': 'basic',
			/*'top.m.texture.image': demo.getRes('floor1.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(15, 10),*/
			'top.m.texture.image': demo.getRes('floor.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(10, 10),
			'top.m.color': '#DAF0F5',
			'top.m.polygonOffset': true,
			'top.m.polygonOffsetFactor': 3,
			'top.m.polygonOffsetUnits': 3,
		}
	};
});


demo.registerFilter('floors02', function(box, json) {
	var width = json.width || 0;
	var height = json.height||0;
	var depth = json.depth||0;
	var translate = json.translate;
	return {
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		shadowHost: true,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.color': '#BEC9BE',
			'm.ambient': '#BEC9BE',
			'top.m.type': 'basic',
			/*'top.m.texture.image': demo.getRes('floor1.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(15, 10),*/
			'top.m.texture.image': demo.getRes('floor.jpg'),
			'top.m.texture.repeat': new mono.XiangliangTwo(10, 10),
			'top.m.color': '#DAF0F5',
			'top.m.polygonOffset': true,
			'top.m.polygonOffsetFactor': 3,
			'top.m.polygonOffsetUnits': 3,
		}
	};
});


demo.registerFilter('floorkt', function(box, json) {
	var width = json.width || 0;
	var height = json.height||0;
	var depth = json.depth||0;
	var translate = json.translate;
	return {
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		shadowHost: true,
		op: '+',
		style: {
			'm.type': 'phong',
			'm.color': '#557E7A',
			'm.ambient': '#557E7A',
			'top.m.type': 'basic',
			'top.m.texture.image': demo.getRes('floorkt.jpg'),
		}
	};
});
demo.registerFilter('floor_box', function(box, json){
	var rotate=json.rotate || [0,0,0];
	return {
		type: 'cube',
		width: 195,
		height: 230,
		depth: 87,
		shadow: true,
		rotate:rotate,
		style:{
			'm.type': 'phong',
			'm.color': '#557E7A',
			'm.ambient': '#557E7A',
			'left.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'right.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'front.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'back.m.lightmap.image': demo.getRes('kongt.jpg'),
			'top.m.normalmap.image': demo.getRes('kongtiao1.png'),
		},
		client: {
			type: 'floor_box'
		}
	};
});



demo.registerFilter('floor_box2', function(box, json){
	var rotate=json.rotate || [0,0,0];
	return {
		type: 'cube',
		width: 195,
		height: 230,
		depth: 87,
		shadow: true,
		rotate:rotate,
		style:{
			'm.type': 'phong',
			'm.color': '#557E7A',
			'm.ambient': '#557E7A',
			'left.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'right.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'front.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'back.m.lightmap.image': demo.getRes('kongt.jpg'),
			'top.m.normalmap.image': demo.getRes('kongtiao1.png'),
		},
		client: {
			type: 'floor_box'
		}
	};
});

demo.registerFilter('ele_power', function(ele_power, json){
	var rotate=json.rotate || [0,0,0];
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	return {
		type: 'cube',
		width: 80,
		height: 220,
		depth: 30,
		shadow: true,
		rotate:rotate,
		style:{
			'm.type': 'phong',
			'm.color': '#557E7A',
			'm.ambient': '#557E7A',
			'left.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'right.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'front.m.lightmap.image': demo.getRes('ele_power.png'),
			'back.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'top.m.normalmap.image': demo.getRes('kongtiao1.png'),
		},
		client: {
			type: 'ele_power'
		}
	};
});//正门入口处一排电箱


demo.registerFilter('ele_power2', function(ele_power2, json){
	var rotate=json.rotate || [0,0,0];
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	return {
		type: 'cube',
		width: 80,
		height: 220,
		depth: 30,
		shadow: true,
		rotate:rotate,
		style:{
			'm.type': 'phong',
			'm.color': '#557E7A',
			'm.ambient': '#557E7A',
			'left.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'right.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'front.m.lightmap.image': demo.getRes('ele_power.png'),
			'back.m.lightmap.image': demo.getRes('kongtiao1.png'),
			'top.m.normalmap.image': demo.getRes('kongtiao1.png'),
		},
		client: {
			type: 'ele_power2'
		}
	};
});//后门入口处一排电箱





var dataJson = {
	objects: [
	
	
	
{
		type: 'floor',//底板
	    width: 3400,//宽2520
		depth:1800,//长2300
		translate: [0, 0, 450,],
	
	},



//	{
//		type: 'floor',//底板
//	    width: 567,//宽2520
//		depth:1200,//长2300
//		translate: [-1005, 0, 600,],
//		
//	},
//	{
//		type: 'floor',//底板
//	    width: 1250,//宽2520
//		depth:1500,//长2300
//		translate: [-100, 0, 450,],
//		
//	},
//	{
//		type: 'floor',//底板
//	    width: 530,//宽2520
//		depth:1180,//长2300
//		translate:  [790, 0, 300,],
//		
//	},
//	{
//		type: 'floor',//底板
//	    width: 240,//宽2520
//		depth:870,//长2300
//		translate:  [1170, 0,440,],
//		
//	},
	{
		type: 'floors',//底板
	    width: 567,//宽2520
		depth:1200,//长2300
		translate: [-1005, 0, 600,],
		height:100,
	},
	{
		type: 'floors',//底板
	    width: 1250,//宽2520
		depth:1500,//长2300
		translate: [-100, 0, 450,],
		height:100,
	},
{
		type: 'floors',//底板
	    width: 530,//宽2520
		depth:1180,//长2300
		translate:  [790, 0, 300,],
		height:100,
	},
{
		type: 'floors',//底板
	    width: 240,//宽2520
		depth:870,//长2300
		translate:  [1170, 0,440,],
		height:100,
	},
	
	//地板构建
	
	
	{
		type: 'floor_cut2',
		width: 200,
		height: 200,
		depth: 100,
		translate: [-1250, 0, 950,],
		rotate: [ 0, Math.PI/180*-90,0],
	},//后门	
     
    {
		type: 'floor_cuts2',
		width: 200,
		height: 25,
		depth: 100,
		translate: [-1250,0,950],	
		rotate: [ 0, Math.PI/180*-90,0],
	}, 
	{
		type: 'floor_cuts2',
		width: 200,
		height: 25,
		depth: 75,
		translate: [-1230,25,950],	
		rotate: [ 0, Math.PI/180*-90,0],
	},{
		type: 'floor_cuts2',
		width: 200,
		height: 25,
		depth: 50,
		translate: [-1210,50,950],	
		rotate: [ 0, Math.PI/180*-90,0],
	},
	
	
	{
		type: 'floor_cut',
		width: 200,
		height: 250,
		depth: 200,
		translate: [50,0,1120],
	    rotate: [Math.PI / 180 * 3, 0, 0],
		
	},//前门斜坡
	
		
		{
		type: 'floor_cuts',
		width: 200,
		height: 25,
		depth: 150,
		translate: [50,5,1120],
	
	},
	{
		type: 'floor_cuts',
		width: 200,
		height: 25,
		depth: 100,
		translate: [50,25,1100],
	
	},{
		type: 'floor_cuts',
		width: 200,
		height: 25,
		depth: 50,
		translate: [50,50,1080],
	
	},//前门入口楼梯
	
	 {
		type: 'floor_cut',
		width: 200,
		height: 20,
		depth: 350,
		translate: [50, 0, 1400],
		rotate: [Math.PI / 180 * 3, 0, 0],
	}, 
	
	{
		type: 'floor_cut',
		width: 200,
		height: 200,
		depth: 180,
		translate: [-1000,0,40],
		rotate: [Math.PI/180*90, 0, 0],
	},//UPS间门
	
		{
		type: 'floor_cuts',
		width: 200,
		height: 25,
		depth: 150,
		translate: [-1000,5,80],
	
	},
	{
		type: 'floor_cuts',
		width: 200,
		height: 25,
		depth: 100,
		translate: [-1000,25,100,]
	
	},{
		type: 'floor_cuts',
		width: 200,
		height: 25,
		depth: 50,
		translate: [-1000,50,120],
	
	},//UPS间楼梯入口
	
	{
		type: 'glass_wall',
		width: 1800,
		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [-1700, 0, 450],
	}, {
		type: 'glass_wall',
		width: 1800,
		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [1700, 0, 450],
	},
	 
	
	
	{
		type: 'floor_box',
		translate: [-1150, 10,1130],	
	},
//	{
//		type: 'floor_box',
//		translate: [-1600, 10, 1130],	
//	},
	{
		type: 'floor_box',
		translate: [-550, 10, 1130],	
	},
{
		type: 'floor_box',
		translate: [-250, 10, 1130],	
	},//正门入口处左侧3个
	
	
	{
		type: 'floor_box',
		translate: [700, 10, 800],	
	},

	{
		type: 'floor_box',
		translate: [900, 10, 800],	
     },//正门入口处右侧2空调
               

	{
		type: 'wall',//墙
		height: 300,//高 3米
		translate: [0, 0, -1200],//坐标
		//墙的四个点（闭合坐标）
		data: [
			
			[1300,310],		
			[1300,1186],
			[1066,1186],		
			[1066,1495],				
		    [-732,1495],
			[-732,1198],
			[-1300,1198],			
			[-1300, 0],
			//[0,0],
			[533,0],
			[533,310],
			[1300,310],
			
			
		], //机房实际尺寸  宽1300长3000
		
		
		
		
		
		children: [	 
		     {
				type: 'door',//前门入口
				width: 205,//宽
				height: 180,//高
				depth: 26,//长
				translate: [50, 0, 1200],//坐标
			},
            
            {
				type: 'door01',//UPS间入口
				width: 205,//宽
				height: 180,//高
				depth: 26,//长
				translate: [-1000,0,0 ],//坐标
			},
            
		    {
				type: 'backdoor',//后门备用门门框
				width: 205,//宽
				height: 180,//高
				depth: 26,//长
				translate: [-1300, 0, 950,],//坐标 2300宽边
				rotate: [0, Math.PI/180*90, 0],
			},	  
			
			{
				type: 'backdoor_cut',//总配电间
				width: 205,//宽
				height: 180,//高
				depth: 26,//长
				translate: [-1300, 100, 150,],//坐标 2300宽边
				rotate: [0, Math.PI/180*90, 0],
			},	
			{
				type: 'backdoor_cut',//总配线间
				width: 205,//宽
				height: 180,//高
				depth: 26,//长
				translate: [-1300, 100, 600,],//坐标 2300宽边
				rotate: [0, Math.PI/180*90, 0],
			},	 
		     
		     
		     
		     
			{
				type: 'window',
			    translate: [-700, 100,1200,],			    
			    width: 1000,
			    height: 150,
			    depth: 50,
			  
			}
           
		],
	},
	

//相对两排机柜之间门
//	{
//		type: 'rackdoor',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//		translate: [-1188, 100, 652],//坐
//	},{
//		type: 'rackdoor',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//		translate: [-465, 100, 652],//坐
//	},{
//		type: 'rackdoor',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//		translate: [230, 100, 652],//坐
//	},{
//		type: 'rackdoor',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//		translate: [961, 100, 652],//坐
//	},{
//		type: 'rackdoor',//门
//		width: 320,//宽
//		height: 225,//高
//		depth: 2,//长
//		translate: [1754, 100, 652],//坐
//	},//正门入口一排隔断门
//	
//	
//	{
//		type: 'rackdoor2',//门AB
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//		
//		translate: [-1188, 100, -722],//坐标
//		
//	},{
//		type: 'rackdoor2',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//		translate: [-465, 100, -722],//坐标
//	},{
//		type: 'rackdoor2',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//	
//		translate: [230, 100, -722],//坐标
//	},{
//		type: 'rackdoor2',//门
//		width: 160,//宽
//		height: 225,//高
//		depth: 2,//长
//	
//		translate: [961, 100, -722],//坐标
//	},
//	{
//		type: 'rackdoor2',//门
//		width: 320,//宽
//		height: 225,//高
//		depth: 2,//长
//		
//		translate: [1754, 100, -722],//坐标
//	},//后门入口一排隔断门

    
	{
		type: 'ele_power2',
		translate: [-950, 100, 1150],
		rotate: [0, Math.PI/180*180, 0],
		
	},
	{
		type: 'ele_power2',
		translate: [-850, 100,1150],
		rotate: [0, Math.PI/180*180, 0],
		
	},
	{
		type: 'ele_power2',
		translate: [-750, 100, 1150],
		rotate: [0, Math.PI/180*180, 0],
	},
	{
		type: 'ele_power2',
		translate: [450, 100, 1150],
		rotate: [0, Math.PI/180*180, 0],
	},//电源供电柜
	
//	{
//		type: 'ele_power2',
//		translate: [130, 100, -702],
//		rotate: [0, Math.PI/180*180, 0],
//	},
//	{
//		type: 'ele_power2',
//		translate: [350, 100, -702],
//		rotate: [0, Math.PI/180*180, 0],
//	},
//	{
//		type: 'ele_power2',
//		translate: [855, 100, -702],
//		rotate: [0, Math.PI/180*180, 0],
//	},
//	{
//		type: 'ele_power2',
//		translate: [1075, 100, -702],
//		rotate: [0, Math.PI/180*180, 0],
//	},
//	{
//		type: 'ele_power2',
//		translate: [1570, 100, -702],
//		rotate: [0, Math.PI/180*180, 0],
//	},
	//后门入口电箱
	
	{
		type: 'racks',//机柜
		translates: [//位置坐标
		
	
		//09N1-09N22  1组
	    [-1150,100,755],
        [-1150,100,684],
        [-1150,100,613],
        [-1150,100,542],
	    [-1150,100,471],
        [-1150,100,400],	
        [-1150,100,329],	
        [-1150,100,258],	
   
		
//		//08N1-08N22  2组
		[-900,100,755],
        [-900,100,684],
        [-900,100,613],
        [-900,100,542],
	    [-900,100,471],
        [-900,100,400],	
   
//
//		
//		//07N1-07N17  3组
		[-650,100,755],
        [-650,100,684],
        [-650,100,613],
        [-650,100,542],
	    [-650,100,471],
        [-650,100,400],	
        [-650,100,329],
//
//	
//		//06N1-06N22  4组
    	[-400,100,755],
        [-400,100,684],
        [-400,100,613],
        [-400,100,542],
	    [-400,100,471],
        [-400,100,400],	
        [-400,100,329],
		[-400,100,258],	
		[-400,100,187],
		[-400,100,116],
		[-400,100,45],
		[-400,100,-26],
//		
//		
//		//05N1-05N22  5组
        [-220,100,755],
        [-220,100,684],
        [-220,100,613],
        [-220,100,542],
	    [-220,100,471],
        [-220,100,400],	
        [-220,100,329],
		[-220,100,258],	
		[-220,100,187],
		[-220,100,116],
		[-220,100,45],
		[-220,100,-26],
//		
//		//04N1-04N22 6组
//
     

		[-70,100,542],
	    [-70,100,471],
        [-70,100,400],	
        [-70,100,329],
		[-70,100,258],
				//间距1.3米	
		//[150,100,187],
		//[150,100,116],
		[-70,100,45],
		[-70,100,-26],
	
		
//
//		
//		//03N1-03N17  7组

		[100,100,826],
		[100,100,755],
		[100,100,684],	
		[100,100,613],	
		[100,100,542],
	    [100,100,471],
        [100,100,400],	
        [100,100,329],
		[100,100,258],
		[100,100,187],
	
		//02N1-02N22   8组
		[350,100,897],
		[350,100,826],
		[350,100,755],
//		[550,100,684],	
//		[550,100,613],	
		//间距1.3米	
		[350,100,542],
	    [350,100,471],
        [350,100,400],	
        [350,100,329],
		[350,100,258],
		[350,100,187],
		[350,100,116],
		[350,100,45],
		[350,100,-26],
		[350,100,-97],
		
				//01N1-01N22  9组
        [500,100,400],	
        [500,100,329],
		[500,100,258],
		[500,100,187],
		[500,100,116],
		[500,100,45],
		[500,100,-26],
		[500,100,-97],
		
//			
//
//
				//  10组
        [700,100,400],	
        [700,100,329],
		[700,100,258],
		[700,100,187],
		[700,100,116],
		[700,100,45],
		[700,100,-26],
		[700,100,-97],
		
				//  11组
		[850,100,400],	
        [850,100,329],
		[850,100,258],
		[850,100,187],
		[850,100,116],
		[850,100,45],
		[850,100,-26],
		[850,100,-97],
		

			//  12组
		[1050,100,420],	
        [1050,100,349],
		[1050,100,278],
		[1050,100,207],


	//  13组
        [1200,100,420],	
        [1200,100,349],
		[1200,100,278],
		[1200,100,207],
		
	],
		labels: (function() {//机柜编号和机柜旋转（开门朝向）
			var labels = [];
			for(var k = 0; k < 1000; k++) {
				var label = 'A';
				labels.push(label + k);
			}
			return labels;
		})(),
		severities: [],//报警信息集合
		numbers: [
		//A //09N1-09N22 1组
		{cabinetid:"cabinetid3",angle: 90,rackstate:"free",cabinetcon:[
			{ ID:"ca4f0324-0851-4b2d-a37a-cd75550d4290",nubner: "4",posi:"1", correct: "true" },
			{ ID:"ca4f0324-0851-4b2d-a37a-cd75550d4290",nubner: "4",posi:"5", correct: "true" },
			{ ID:"ca4f0324-0851-4b2d-a37a-cd75550d4290",nubner: "1",posi:"9", correct: "false" },
			{ ID:"ca4f0324-0851-4b2d-a37a-cd75550d4290",nubner: "20",posi:"11", correct: "true" },
			{ ID:"ca4f0324-0851-4b2d-a37a-cd75550d4290",nubner: "30",posi:"12", correct: "true" },
			] 
		},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"power",cabinetcon:[
			{ ID:"ca4f0324-0851-4b2d-a37a-cd75550d4290",nubner: "100",posi:"1", correct: "true",numberchild: [//竖存储设备集合
				{ ID: "a553e033-f297-4a17-aadd-eecb10e4cb7c", sime: "1", correct: "true" }, //竖存储设备ID 竖存储设备编号  是否报警
				{ ID: "d50fa5b1-9d8b-4704-86cd-5920757051fc", sime: "2", correct: "true" }, 
				{ ID: "4848c36a-af20-4fff-bcdb-fe04dfde410c", sime: "3", correct: "true" }, 
				{ ID: "f11de507-c4e1-4a13-ac68-f5efb954318d", sime: "1", correct: "false" }, 
				{ ID: "b16a579f-ea7c-4b9e-b611-42504230c720", sime: "1", correct: "true" }, 
				{ ID: "261c8e51-8c91-421f-962f-f090a88468b0", sime: "1", correct: "true" }, 
				{ ID: "cdeef45d-1605-4d7f-a315-df3395a22fdc", sime: "2", correct: "false" }, 
				{ ID: "24f63ad7-9716-4345-b547-d7be6315525c", sime: "2", correct: "true" }, 
				{ ID: "3b59fba1-4add-4741-b82d-852ac0458899", sime: "3", correct: "true" }, 
				{ ID: "2637e13c-df80-487d-be6d-f0da5cb48f31", sime: "3", correct: "true" }] 
			},
			] 
		},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
	/*	{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},	*/
		
		
		//B//08N1-08N22 2组
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"free",cabinetcon:[
			{ nubner: "4",posi:"1", correct: "true" },
			{ nubner: "4",posi:"5", correct: "true" },
			{ nubner: "1",posi:"9", correct: "false" },
			{ nubner: "20",posi:"11", correct: "true" },
			{ nubner: "30",posi:"12", correct: "true" },
			] 
		},
		
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},					
		
		//C//07N1-07N17 3组
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"free",cabinetcon:[
			{ nubner: "40",posi:"1", correct: "true" },
			{ nubner: "41",posi:"3", correct: "true" },
			{ nubner: "50",posi:"6", correct: "false" },
			{ nubner: "51",posi:"8", correct: "true" },
			{ nubner: "52",posi:"10", correct: "true" },
			] 
		},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},		
		//D//06N1-06N22  4组
		
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"free",cabinetcon:[
			{ nubner: "31",posi:"1", correct: "true" },
			{ nubner: "73",posi:"18", correct: "true" },
			{ nubner: "74",posi:"22", correct: "false" },
			{ nubner: "75",posi:"28", correct: "true" },
			{ nubner: "30",posi:"12", correct: "true" },
			] 
		},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},		
		//E//05N1-05N22  5组
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},		
		//F//04N1-04N22  6组
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		
		//G//03N1-03N17  7组
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},	
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: 90,rackstate:"",cabinetcon:[]},
		
		//H//02N1-02N22 8组
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		
		//I//01N1-01N22 9组
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
	
	
		//J   10组
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		
		//K   11组
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		
		//L  12组
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		
		//M  13组
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		{cabinetid:"cabinetid3",angle: -90,rackstate:"",cabinetcon:[]},
		
		]
	}]
};







function detrleshebei(a){
	$(a).parents("tr").remove();
}


    
