var demo = {
	LAZY_MIN: 1000,
	LAZY_MAX: 6000,
	CLEAR_COLOR: '#39609B',
	RES_PATH: 'img',

	lastElement: null,
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
		return demo.defaultEnvmap;
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
		/*创建搜索模块开始*/
		var div = document.getElementById('div');
		if(div) {
			document.body.removeChild(div);
		}
		div = document.createElement('div');
		div.setAttribute('id', 'div');
		
		div.innerHTML = "<div class='name' style='float:left'>机房名称：</div><div class='namecon'>电子机房</div>"+
						"<div class='name' style='float:left'>机柜数量：</div><div class='namecon'>11</div>"+
						"<div class='name' style='float:left'>存储总量：</div><div class='namecon'>100</div>"+
						"<div class='name' style='float:left'>报警数量：</div><div class='namecon'>6</div>"+
						"<div class='name' style='float:left'>室内温度：</div><div class='namecon'><span>28</span>℃</div>"+
						"<div class='name' style='float:left'>室内湿度：</div><div class='namecon'><span>10</span>%</div>"
		
		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.right = '20px';
		div.style.top = '20px';
		div.style.width = '510px';
		div.style.height = '140px';
		div.style.background = 'rgba(164,186,223,0.75)';
		div.style['border-radius'] = '5px';
		document.body.appendChild(div);

		/*创建搜索框结束*/
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


		var time1 = new Date().getTime();
		demo.loadData(gl3dview);
		var time2 = new Date().getTime();
		console.log('time:  ' + (time2 - time1));

		demo.resetGleye(gl3dview);//初始图像所在的位置与偏移量
	},
	//初始图像所在的位置与偏移量
	resetGleye: function(gl3dview) {
		gl3dview.getGleye().setPosition(-4000, 2000, 2000);
		gl3dview.getGleye().lookAt(new mono.XiangliangThree(0, 0, 0));
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
	loadRackContent: function(box, x, y, z, width, height, depth, severity, cube, cut, json, parent, oldRack, numbers) {
		var positionY = 10;
		var serverTall = 9;
		var serverGap = 2;
		var findFaultServer = false;

		var numb = json.numbers.length;
		
		var num = json.label.slice(1) * 1;

		if(numb >= num) {
			var numberlength = numbers[num].length;
			
			for(var i = 0; i < numberlength; i++) {
				var number = numbers[num][i].nubner * 1;
				
				var numbercon = numbers[num][i];
				
				if(number<=2){
					var ID = numbers[num][i].ID;
					if(numbers[num][i].correct=="false"){
						var m ="";
						 m = i;
					}
				}
				var numberchild = numbers[num][i].numberchild;
				var pic = 'server' + number + '.jpg';
				//错误机版变成红色
				var color = (i === m) ? severity.color : null;
				var server = this.createServer(box, cube, cut, pic, color, oldRack, numberchild, json,numbercon);

				var size = server.getBizBox().size();
				if(color) {
					findFaultServer = true;
				}
				server.setPositionY(positionY + size.y / 2 - height / 2);
				server.setPositionZ(server.getPositionZ() + 5);
				server.setParent(parent);
				positionY = positionY + size.y + serverGap;
				if(positionY > 200) {
					box.removeByDescendant(server, true);
					break;
				}
			}
		}
	},
	//机柜内储存的构建方法
	createServer: function(box, cube, cut, pic, color, oldRack, numberchild, json,numbercon) {
		var picMap = {
			'server1.jpg': 4.445 * 2,
			'server2.jpg': 4.445 * 3,
			'server3.png': 4.445 * 6,
		}
		var ID = numbercon.ID;
		var x = cube.getPositionX();
		var z = cube.getPositionZ();
		var width = cut.getWidth();
		var height = picMap[pic];
		var depth = cut.getDepth();

		var serverBody = new mono.Cube(width - 2, height - 2, depth - 4);
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

		return server;
	},
	//存储设备属性 
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

	createShadowImage: function(box, floorWidth, floorHeight) {
		var canvas = document.createElement('canvas');
		canvas['width'] = floorWidth;
		canvas['height'] = floorHeight;
		var context = canvas.getContext('2d');
		context.beginPath();
		context.rect(0, 0, floorWidth, floorHeight);
		context.fillStyle = 'white';
		context.fill();

		var marker = function(context, text, text2, x, y) {
			var color = '#0B2F3A'; //'#0B2F3A';//'#FE642E';
			context.font = 60 + 'px "Microsoft Yahei" bold';
			context.fillStyle = color;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			//context.shadowBlur = 30;
			context.fillText(text, x, y);
			context.strokeStyle = color;
			context.lineWidth = 3;
			context.strokeText(text, x, y);

			if(!text2) return;
			y += 52;
			color = '#FE642E';
			context.font = 26 + 'px "Microsoft Yahei" ';
			context.fillStyle = color;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText(text2, x, y);
		}

		box.forEach(function(object) {
			if(object instanceof mono.Entity && object.shadow) {
				var translate = object.getPosition() || { x: 0, y: 0, z: 0 };
				var rotate = object.getRotation() || { x: 0, y: 0, z: 0 };
				var rotate = -rotate[1];

				demo.paintShadow(object, context, floorWidth, floorHeight, translate, rotate);
			}
		});

		return canvas;
	},

	paintShadow: function(object, context, floorWidth, floorHeight, translate, rotate) {
		var type = object.getClient('type');
		var shadowPainter = demo.getShadowPainter(type);

		if(shadowPainter) {
			shadowPainter(object, context, floorWidth, floorHeight, translate, rotate);
		}
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
				
				/*console.log(object);*/
				if(value == 1){
					if(object.isfirst){
						object.isfirst = false;
					}else{
						var div = document.createElement('div');
						div.style['background'] = '#fff';
						if(object.names){
							div.innerHTML= object.names;
							demo.showDialog(div, "描述", 510, 280);
						}
						/*console.log(object);*/
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

	
	resetView: function(gl3dview) {
		demo.resetGleye(gl3dview);//初始图像所在的位置与偏移量

		//reset all racks. unload contents, close door.
		var loadedRacks = [];
		gl3dview.getServa().forEach(function(element) {
			if(element.getClient('type') === 'rack' && element.oldRack) {
				loadedRacks.push(element);
			}
		});
		for(var i = 0; i < loadedRacks.length; i++) {
			//restore the old rack.
			var newRack = loadedRacks[i];
			var oldRack = newRack.oldRack;

			if(newRack.alarm) {
				gl3dview.getServa().getAlarmBox().remove(newRack.alarm);
			}
			gl3dview.getServa().removeByDescendant(newRack, true);

			gl3dview.getServa().add(oldRack);
			if(oldRack.alarm) {
				gl3dview.getServa().getAlarmBox().add(oldRack.alarm);
			}
			oldRack.door.setParent(oldRack);
			oldRack.setClient('loaded', false);

			//reset door.
			var door = oldRack.door;
			gl3dview.getServa().add(door);
			if(door.getClient('animated')) {
				demo.playAnimation(door, door.getClient('animation'));
			}
		}

		//复位门
		var doors = [];
		gl3dview.getServa().forEach(function(element) {
			if(element.getClient('type') === 'left-door' || element.getClient('type') === 'right-door') {
				doors.push(element);
			}
		});
		for(var i = 0; i < doors.length; i++) {
			var door = doors[i];
			if(door.getClient('animated')) {
				demo.playAnimation(door, door.getClient('animation'));
			}
		}

	},

	resetRackPosition: function(gl3dview) {
		//reset all rack position
		gl3dview.getServa().forEach(function(element) {
			if(element.getClient('type') === 'rack') {
				element.setPosition(element.getClient('origin'));
			}
		});
	}
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

demo.registerFilter('floor_cut', function(box, json) {
	return {
		type: 'cube',
		width: 100,
		height: 100,
		depth: 100,
		op: '-',
		style: {
			'm.texture.image': demo.getRes('floor.jpg'),
			'm.texture.repeat': new mono.XiangliangTwo(4, 4),
			'm.color': '#DAF0F5',
			'm.lightmap.image': demo.getRes('outside_lightmap.jpg'),
			'm.polygonOffset': true,
			'm.polygonOffsetFactor': 3,
			'm.polygonOffsetUnits': 3,
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
	/*var datas = json.datas;*/
	var labels = json.labels || [];
	var numbers = json.numbers;
	var rotate = json.rotate;
	if(translates) {
		for(var i = 0; i < translates.length; i++) {
			var translate = translates[i];
			var severity = severities[i];
			var numberm = numbers[i];
			//判断哪个机柜报警
			if(numberm) {
				for(var j = 0; j < numberm.length; j++) {
					if(numberm[j].nubner <= 2) {
						if(numberm[j].correct == "false") {
							severity = mono.AlarmSeverity.CRITICAL
						}
					}
					if(numberm[j].nubner==3){ 
						for(var m=0;m<numberm[j].numberchild.length;m++){
							if(numberm[j].numberchild[m].correct=="false"){
								severity = mono.AlarmSeverity.CRITICAL
							}
						}
					}
				}
			}
			/*var data = datas[i];*/
			var label = labels[i] || '';
			var rack = {
				type: 'rack',
				shadow: true,
				translate: translate,
				severity: severity,
				/*data: data,*/
				label: label,
				rotate:rotate
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
		height: 200,
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
		rotate:rotate,
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
		rotate:rotate,
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
		rotate:rotate,
		translate: [x, y, z],
		op: '+',
		sideColor: '#A5BDDD',
		topColor: '#D6E4EC',
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
	var rotate = json.rotate || [0, 0, 0];

	return [{
		//door frame.
		type: 'cube',
		width: width,
		height: height,
		depth: depth,
		rotate:rotate,
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
		rotate:rotate,
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
		rotate:rotate,
		translate: [x, frameBottomEdge + 1, z+50],
		sideColor: 'orange',
		topColor: 'orange',
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
		translate: [x, frameBottomEdge + 1, z-50],
		sideColor: 'orange',
		topColor: 'orange',
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
		rotate:rotate,
		translate: [x, height * 0.6, z-width+80],
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
			'type': 'door_lock',
		},
	}];
});

demo.registerFilter('glass_wall', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 100,
		height = json.height || 200,
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
//储备片
demo.registerCreator('rack', function(box, json) {

	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 60;
	var height = json.height || 200;
	var severity = json.severity;
	var depth = json.depth || 80;
	var rotate = json.rotate;
	/*var data = json.data;*/
	var label = json.label;
	var shadow = json.shadow;
	var numbers = json.numbers;

	
	var rack = new mono.Cube(width, height, depth);
	rack.s({
		'm.color': '#557E7A',
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
		'm.ambient': '#557E7A',
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
	rack.setClient('dbl.func', function() {
		var div = document.createElement('div');
		demo.showDialog(div, "123", 610, 280);
	});
	var labelCanvas = demo.generateAssetImage(label);
	rack.setStyle('top.m.texture.image', labelCanvas);
	rack.setStyle('top.m.specularmap.image', labelCanvas);
	rack.setClient('type', 'rack');
	rack.setClient('origin', rack.getPosition().clone());
	rack.setClient('loaded', false);
	rack.shadow = shadow;
	rack.setClient('dbl.func', function() {
		var CabinetId = "09317296-be27-41df-af3b-24282bef3b899";
		$.ajax({
			type: "get",
	        async: false,
	        url: "http://192.168.1.100:9898/Handler/3DAlarm.ashx",
	        dataType: "jsonp",
	        jsonp: "callback",
	        jsonpCallback: 'jsonpCallback',   //这里为后台返回的动态函数
	        data:{"requestname": "getCabinetDetail", "CabinetId": CabinetId },
	        success: function (data) {
	        	console.log(data);
	        	var equipmenthtml = "";
	            for(var i=0;i<data[0].DeviceInfoList.length;i++){
	            	if(data[0].DeviceInfoList[i].AlarmState=="0"){
	            		var imgs = "<img src='img/greens.png'>" 
	            	}
	            	if(data[0].DeviceInfoList[i].AlarmState=="1"){
	            		var imgs = "<img src='img/reds.png'>" 
	            	}
	            	equipmenthtml = equipmenthtml + "<tr>"+
	            						"<td>"+data[0].DeviceInfoList[i].DeviceSN+"</td>"+
	            						"<td>"+data[0].DeviceInfoList[i].DeviceSort+"</td>"+
	            						"<td>"+data[0].DeviceInfoList[i].DeviceName+"</td>"+
	            						"<td>"+data[0].DeviceInfoList[i].Affiliation+"</td>"+
	            						"<td>"+data[0].DeviceInfoList[i].MechanismFoUse+"</td>"+
	            						"<td>"+imgs+"</td>"+
	            					"</tr>"
	            }
	            var div = document.createElement('div');
				div.style['background-color'] = 'rgba(255,255,255,0.85)';
				div.style['font-size'] = '12px';
				div.style['color'] = 'darkslategrey';
				div.innerHTML = '<div style="height:130px;">'+
						'<div class="name" style="float:left;font-size:14px">机柜编号：</div>'+'<div class="namecon" style="float:left;font-size:14px">'+data[0].CabinetNo+'</div><div style="clear:both"></div>'+
						'<div class="name" style="float:left;font-size:14px">描述：</div>'+'<div class="namecon1">'+data[0].CabinetNo+'</div>'+
					'</div>'+
				    '<div style="height:240px;overflow:auto"><table style="width:100%">' +
					'<thead>' +
					'<tr><th width="60px">设备编号</th><th width="80px">设备类别</th><th width="100px">设备名称</th><th width="100px">所属机构</th><th>使用机构</th><th width="60px">状态</th></tr>' +
					'</thead>' +
					'<tbody>' + equipmenthtml + '</tbody></table></div>';
				demo.showDialog(div, "警告！", 510,450);
	        },
	        error: function () {
	            alert("错误");
	        }
			
		})
	});

	var rackDoor = new mono.Cube(width, height, 2);
	rackDoor.s({
		'm.type': 'phong',
		'm.color': '#A5F1B5',
		'm.ambient': '#A4F4EC',
		'front.m.texture.image': demo.getRes('rack_front_door.jpg'),
		'back.m.texture.image': demo.getRes('rack_door_back.jpg'),
		'm.envmap.image': demo.getEnvMap(),
	});
	
	rackDoor.setParent(rack);
	rack.door = rackDoor;
	rackDoor.setPosition(0, 0, depth / 2 + 1);
	rackDoor.setClient('animation', 'rotate.left.-100');
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
		var cut = new mono.Cube(width * 0.75, height - 10, depth * 0.7);
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

		var newRack = new mono.ComboNode([cube, cut], ['-']);

		var x = rack.getPosition().x;
		var y = rack.getPosition().y;
		var z = rack.getPosition().z;

		newRack.p(x, y, z);
		newRack.setClient('type', 'rack');
		newRack.oldRack = rack;
		rack.newRack = newRack;
		newRack.setClient('dbl.func', function() {
			var CabinetId = "09317296-be27-41df-af3b-24282bef3b899";
			$.ajax({
				type: "get",
		        async: false,
		        url: "http://192.168.1.100:9898/Handler/3DAlarm.ashx",
		        dataType: "jsonp",
		        jsonp: "callback",
		        jsonpCallback: 'jsonpCallback',   //这里为后台返回的动态函数
		        data:{"requestname": "getCabinetDetail", "CabinetId": CabinetId },
		        success: function (data) {
		        	console.log(data);
		        	var equipmenthtml = "";
		            for(var i=0;i<data[0].DeviceInfoList.length;i++){
		            	if(data[0].DeviceInfoList[i].AlarmState=="0"){
		            		var imgs = "<img src='img/greens.png'>" 
		            	}
		            	if(data[0].DeviceInfoList[i].AlarmState=="1"){
		            		var imgs = "<img src='img/reds.png'>" 
		            	}
		            	equipmenthtml = equipmenthtml + "<tr>"+
		            						"<td>"+data[0].DeviceInfoList[i].DeviceSN+"</td>"+
		            						"<td>"+data[0].DeviceInfoList[i].DeviceSort+"</td>"+
		            						"<td>"+data[0].DeviceInfoList[i].DeviceName+"</td>"+
		            						"<td>"+data[0].DeviceInfoList[i].Affiliation+"</td>"+
		            						"<td>"+data[0].DeviceInfoList[i].MechanismFoUse+"</td>"+
		            						"<td>"+imgs+"</td>"+
		            					"</tr>"
		            }
		            var div = document.createElement('div');
					div.style['background-color'] = 'rgba(255,255,255,0.85)';
					div.style['font-size'] = '12px';
					div.style['color'] = 'darkslategrey';
					div.innerHTML = '<div style="height:130px;">'+
							'<div class="name" style="float:left;font-size:14px">机柜编号：</div>'+'<div class="namecon" style="float:left;font-size:14px">'+data[0].CabinetNo+'</div><div style="clear:both"></div>'+
							'<div class="name" style="float:left;font-size:14px">描述：</div>'+'<div class="namecon1">'+data[0].CabinetNo+'</div>'+
						'</div>'+
					    '<div style="height:240px;overflow:auto"><table style="width:100%">' +
						'<thead>' +
						'<tr><th width="60px">设备编号</th><th width="80px">设备类别</th><th width="100px">设备名称</th><th width="100px">所属机构</th><th>使用机构</th><th width="60px">状态</th></tr>' +
						'</thead>' +
						'<tbody>' + equipmenthtml + '</tbody></table></div>';
					demo.showDialog(div, "警告！", 510,450);
		        },
		        error: function () {
		            alert("错误");
		        }
				
			});
		});
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

		demo.loadRackContent(box, x, y, z, width, height, depth, severity, cube, cut, json, newRack, rack, numbers);
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
	var picture = json.picture || demo.getRes('tv.jpg');
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
	}, {
		//'tv screen',
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
		demo.showDialog(video, "图标信息", 725, 550);
	});
	box.add(tv);
});

demo.registerCreator('post', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var width = json.width || 100,
		height = json.height || 200;
	var rotate = json.rotate || [0, 0, 0];

	var posts = [{
		type: 'cube',
		width: width,
		height: height,
		translate: [x, y, z],
		rotate: rotate,
		style: {
			'm.type': 'phong',
			'front.m.texture.image': demo.getRes('post.jpg'),
		},
	}];

	var post = demo.createCombo(posts);
	box.add(post);
});
demo.registerFilter('floor_box', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var width = json.width || 100,
		height = json.height || 200;
	var imgs = json.imgs;
	return {
		type: 'cube',
		width: width,
		height: height,
		depth: 50,
		shadow: true,
		sideColor: '#C3D5EE',
		topColor: '#D6E4EC',
		style:{
			'left.m.texture.image': demo.getRes(imgs),
			'm.ambient': '#B8B9B4',
		},
		client: {
			type: 'floor_box'
		}
	};
});
demo.registerFilter('peidian', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var width = json.width || 100,
		height = json.height || 200;
	var imgs = json.imgs;
	return {
		type: 'cube',
		width: width,
		height: height,
		depth: 50,
		shadow: true,
		sideColor: '#C3D5EE',
		topColor: '#D6E4EC',
		style:{
			'right.m.texture.image': demo.getRes(imgs),
			'top.m.lightmap.image': demo.getRes('peidian_bg.png'),
			'back.m.lightmap.image': demo.getRes('peidian_bg.png'),
			'front.m.lightmap.image': demo.getRes('peidian_bg.png'),
		},
		client: {
			type: 'peidian'
		}
	};
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


var dataJson = {
	objects: [{
		type: 'floor',
		width: 1300,
		depth: 2600,
	}, {
		type: 'floor_cut',
		width: 200,
		height: 20,
		depth: 260,
		translate: [900, 0, 530],
		rotate: [Math.PI / 180 * 3, 0, 0],
	},{
		type: 'floor_box',//立式空调
		width: 70,
		height: 180,
		depth: 80,
		translate: [450, 0, -500],
		imgs:'kong_font.png'
	},{
		type: 'floor_box',//挂式空调
		width: 30,
		height: 30,
		depth: 150,
		translate: [470, 160, 450],
		imgs:'kong1.png'
	},
	{
		type: 'peidian',//配电箱
		width: 100,
		height: 100,
		depth: 100,
		translate: [-450, 0, -600],
		imgs:'peidian.png'
	},{
		type: 'wall',
		height: 200,
		translate: [-500, 0, -500],
		data: [
			[0, -600],
			[1000, -600],
			[1000, 1600],
			[0, 1600],
			[0,-600]
		],
		children: [{
			type: 'window',
			translate: [500, 30, 700],
			width: 220,
			height: 150,
			depth: 50,
			rotate: [0, Math.PI / 180 * 90, 0],
		}, {
			type: 'door',
			width: 205,
			height: 180,
			depth: 26,
			translate: [-500, 0, 900],
			rotate: [0, Math.PI / 180 * 90, 0],
		}],
	}, {
		type: 'plants',
		shadow: true,
		translates: [
			[400, 0, 1200],
			[0, 0, 1200],
			[-400, 0, 1200],
			[400, 0, -1200],
			[0, 0, -1200],
			[-400, 0, -1200],
		],
	},{
		type: 'plants',
		scale: [0.5, 0.3, 0.5],
		shadow: false,
		translates: [
			[515, 27, 620],
			[515, 27, 780],
		],
	},{
		type: 'glass_wall',
		width: 1300,
//		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [0, 0, 1290],
	}, {
		type: 'glass_wall',
		width: 1300,
//		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [0, 0, -1290],
	}, {
		type: 'racks',
		rotate: [0, Math.PI / 180 * 90, 0],
		translates: [
		//第一排
			[-150, 0, 250],
			[-150+62, 0, 250],
			[-150+62+62, 0, 250],
			[-150+62+62+62, 0, 250],
		//第二排
			[-150, 0, 0],
			[-150+62, 0, 0],
			[-150+62+62, 0, 0],
			[-150+62+62+62, 0, 0],
		//第三排
			[-150, 0, -270],
			[-150+62, 0, -270],
			[-150+62+62, 0, -270],
			[-150+62+62+62, 0, -270],
			[-150+62+62+62+62, 0, -270],
		],
		labels: (function() {
			var labels = [];
			for(var k = 0; k < 14; k++) {
				var label = 'A';
				labels.push(label + k);
			}
			return labels;
		})(),
		datas: [
			[{ number: "A0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "A0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "A0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "A0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "A0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "A0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "A0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "A0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "B0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "B0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "B0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "B0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "B0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "B0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "B0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "B0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "C0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "C0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "C0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "C0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "C0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "C0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "C0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "C0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "D0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "D0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "D0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "D0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "D0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "D0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "D0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "D0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "E0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "E0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "E0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "E0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "E0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "E0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "E0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "E0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "F0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "F0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "F0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "F0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "F0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "F0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "F0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "F0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "G0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "G0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "G0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "G0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "G0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "G0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "G0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "G0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "H0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "H0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "H0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "H0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "H0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "H0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "H0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "H0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "I0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "I0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "I0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "I0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "I0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "I0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "I0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "I0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "J0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "J0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "J0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "J0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "J0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "J0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "J0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "J0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "K0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "K0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "K0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "K0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "K0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "K0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "K0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "K0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "L0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "L0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "L0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "L0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "L0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "L0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "L0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "L0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],

			[{ number: "M0001001", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/greens.png'>" },
				{ number: "M0001002", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "M0001003", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "M0001004", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "M0001005", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "M0001006", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "M0001007", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" },
				{ number: "M0001008", name: "外网汇聚路由器", brand: "华三", model: "SR6608-X", state: "<img src='img/reds.png'>" }
			],
		],
		
		severities: [null, null, null, null, null, null, null, null, null, null, null],
		numbers: [
			//A0
			[{nubner:"0"},{ ID:"ca4f0323-0851-4b2d-a37a-cd75550d4290",nubner: "1", numberchild: "", correct: "false" },
			{nubner:"0"},{ ID:"780ba8bb-3612-4496-a01d-5915560d3b6d",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"701114e7-57d1-429c-8a59-1696d820a695",nubner: "1", numberchild: "", correct: "true" },
			{nubner:"0"},{ ID:"cdfedd20-f71f-4602-a81b-cb3481ee09de",nubner: "2", numberchild: "", correct: "false" }
			],
			//A1
			[{ ID:"0ff458ed-c60d-4dd8-aa9f-1a2f6b643771",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"d4906026-ff64-4e88-8eb0-8fbe2a531fac",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"8bd7958c-a9fd-473d-a6b5-ae0d85833a17",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c2070edf-193c-4fd6-a0e7-506430a479e7",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"724402c9-3961-4864-b93a-09a98b9ff700",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"d53a1695-eeb7-4342-9fa4-17500e19a17d",nubner: "2", numberchild: "", correct: "true" }],
			//A2
			[{ ID:"3e8bc210-04b7-47af-9967-6a48d3865869",nubner: "1", numberchild: "", correct: "false" },
			{ ID:"f6e302fa-d36e-4db8-b362-c948835d33b9",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"6dddd3b7-620d-48bf-a11d-e12943c0d187",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"2ee8974b-9d6f-4213-8fda-627d9d1e2078",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c43d6c1e-8cd5-4049-af86-7f832594a893",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"c0658652-d251-434b-8e84-31ee5e44b17c",nubner: "2", numberchild: "", correct: "true" }],
			//A3
			[{ ID:"cec27331-5afd-4226-a556-cb947335dcdc",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"9321affc-f8fd-4cdc-818c-f9d3274e1329",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"d2fb6f48-46a1-4663-8962-3aa76cf2bdd0",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c6b1aa83-1eb9-4690-a1c9-1be9ddb90ceb",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"a38e51f0-2f7b-4b5e-872c-49f3d58dd590",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"2ccd2dd0-1e19-4d3a-a7f1-4ff017bd1603",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"e5fc6f7c-0a5d-4625-b67f-1a7998646559",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"fd7f6b4e-b7db-4e21-aa5b-6bcf38fe9c74",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"5a4f51f4-ea98-467d-94d3-688053e4e5eb",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"5f7c05c1-4005-484a-8f25-4d6942afe4b5",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"bb9edba2-d985-48b2-9290-423ccc11d095",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"1ea88598-16ad-48c9-ad1d-a1cba6d7371c",nubner: "2", numberchild: "", correct: "true" }],
			//A4
			[{ ID:"24c7e8f5-ca2a-4a37-ac80-33847bce1a60",nubner: "1", numberchild: "", correct: "false" },
			{ ID:"e2fcc4bb-993f-4c58-ba20-91272a76ef42",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"a713bf4e-b9cf-4af0-8ba0-049c86ff6ca2",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"83cc61cc-db68-4472-a9d8-dbfd49a8a68f",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"f95ee360-634c-4d73-b349-6b33b0158d74",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"637aa8bd-3c1d-4cb9-b6bd-88146790b489",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"73203889-3102-48ba-9297-b0d2a2213af2",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"f360043b-d9a2-48e8-9f7b-a808343e25bf",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"5b4184c9-a013-4319-a158-6593468757ec",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c771d44e-7b4e-46af-8599-9566879e733c",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"4b812d55-4b0c-4c89-b293-a719c69ab788",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"c6ed6560-5fec-41e4-a1c7-fe7e3dccae61",nubner: "2", numberchild: "", correct: "true" }],
			//A5
			[{ ID:"03bee434-0be9-4a4c-ab09-969a21646aff",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"62939fed-36dd-4269-b923-3aa856e85bf2",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"ded9f026-88c3-4cbe-9b48-8c560a820170",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"4ee07ac1-8411-4ae8-be3b-0fe3d10502d8",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"88a1f42d-663a-4a2b-bde4-5a42cfcd569f",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"1d817347-7d4f-4609-927f-1c0542800a3d",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"f6a6850c-1743-49cc-ac74-90e476e1bb3a",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"4c7bd1c3-640c-48a2-9c84-ed6c265145d6",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"0e8c6155-47b4-4c57-905e-7b8e9b2740b4",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"cdf7b536-8919-40a2-9a3b-54a254e591b8",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"5bbd878e-1dc6-43fd-95eb-6b91cccbc1c5",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"37c7e1aa-c8ac-4d02-9455-a8308d9b9184",nubner: "2", numberchild: "", correct: "true" }],
			//A6
			[{ ID:"8168882f-5f78-4446-b98a-ef2a230c4169",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"10d79938-cbe3-4835-a12a-66cc77cd8caa",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"b4db1e36-3aaf-4731-8347-c1472e480035",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"70bf7597-aa29-4c99-a96e-6626027ae123",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"1689a3a1-9bc2-4271-b0df-0e7d51d0a0b1",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"7562286f-32ae-4a15-abd7-1b8823b79a9d",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"80f26dd6-0569-4497-a45d-b34c5e407274",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"84e2c139-13f1-4af4-82c2-a05b32b382e5",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"240d8f15-57b5-4ba0-a186-565ca9f8d5ac",nubner: "1", numberchild: "", correct: "true" }],
			//A7
			[{ ID:"261a68b6-186d-4018-8759-681044dba395",nubner: "1", numberchild: "", correct: "false" },
			{ ID:"f7d598ee-fcd8-4460-8699-1641a5b34ddb",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"c8acd139-3826-4363-9f51-827319ed7611",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"8e20ef1b-6fc6-4119-8f8c-3cac9cbc7b5a",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"babf1750-bdea-4231-a032-29aa49cca002",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"84057a76-661e-40d9-9100-3fda8cd5340d",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"9c7a00a1-11fd-42e4-94fc-0e2d9dbfc71f",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"3fd87081-2082-414f-b8c8-04acd2fb50f0",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"c7282857-f52a-4d9f-9b34-4b37bd7b6057",nubner: "1", numberchild: "", correct: "true" }],
			//A8
			[{ ID:"4d742185-ca5e-4294-a3e4-a04d1317763d",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"a927ddf2-97e9-4ae7-96f6-5654e0304603",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"5d79dbf0-26e4-4c38-a81f-f793998e1dc9",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"d9751c61-41c3-448b-8aad-a7dc730f788d",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"a796bf6c-3d1d-46fa-b725-841d17d79524",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"4d91284d-d1cf-433b-9f5e-c9bd3dc4467d",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"94d15c2c-ff1f-45a3-8bff-d20c5811ae2b",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"47d0249a-da84-42d4-b684-9acfb95509bd",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"cefd1340-6b19-49b0-b4de-525fa06905c7",nubner: "1", numberchild: "", correct: "true" }],
			//A9
			[{ ID:"690ed7be-e8b0-4f25-9699-52804769c17d",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"e85f2ded-ca8d-4e6b-80b2-8a7a2d71e87b",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"2bb9d5b0-0668-4125-af1b-f1f8057cda3a",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"edb06326-861a-45c7-ab24-37b540882665",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"3d88a53d-4bbd-4751-affe-f7ac220d31b1",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"c12f986d-dac4-423d-9f1d-cde740c8e398",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"3680a64d-8028-4025-b3ce-d327c9d87afc",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"8a4c8278-5a44-4bd8-ab81-d5df5519f8df",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"062b0c5b-21e6-4afe-8da8-afc651b3dc70",nubner: "1", numberchild: "", correct: "true" }],
			//A10
			[{ ID:"93a6c80d-52bb-4f4e-bea7-ce83f27245ad",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"4e0940bb-31aa-4568-a980-53b8022a00e4",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"747e61ba-ffdf-424f-bd9d-5cf14939c7ce",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"35152993-a9f4-49c4-93ed-f2b00753b225",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"40e8ad50-3a38-4543-8abf-5f84d2764f88",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"902d5162-7669-4316-91fa-3256569342fe",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"b590dac8-956a-483c-b5c8-c92f0f9f6da6",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"4af0772d-5ead-4bdf-8032-d5ee4e674d0a",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"3be04d84-0b9b-4b2b-ba9d-f59b43da00dd",nubner: "1", numberchild: "", correct: "true" }],
			//A11
			[{ ID:"97703174-cf43-4037-9256-733cad75fd2b",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"a8d69d6d-c95c-4516-834f-a654c1faf08e",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"10bfe3ea-2ebe-46eb-9c34-8978a5a8a3d0",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"b2f0f750-3e4f-400d-a4a0-e6300f65243d",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"760f382b-7257-4883-b38d-5f2fde3b5fce",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"773e52e7-623d-4fdb-abba-448b78553f02",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"3f24e650-2893-4552-846d-c0619f4ad6b2",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c7fcb5a1-0b1b-4cb8-9d2b-c696c29652e5",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"25a62ac9-fbe4-4ddb-82aa-71a9b4d02ef9",nubner: "1", numberchild: "", correct: "true" }],
			//A12
			[{ ID:"c50636b0-ec6d-4938-be5f-bb573349b4bc",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"62f0b195-e680-42ca-9dee-5a0d2e2d1b78",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"343cbd51-18b9-47af-97b0-9790e3300bf8",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"eb6437ac-5378-4eb4-be4b-5d84a5c03a63",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"e799a4cc-14ec-46b0-bc2d-9498d25799f1",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"9ea7dcd3-b0f8-4608-a552-723c756df5d5",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"7a5ca103-fee5-43e2-aa51-2ee884797eba",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"3e2060be-5ee7-4090-92ac-6c712c0cd3c9",nubner: "2", numberchild: "", correct: "true" },
			{ ID:"e9792749-5e1c-4003-9014-71ff0a979984",nubner: "1", numberchild: "", correct: "true" }],
		]
	}, {
		type: 'tv',
		translate: [480, 100, 0],
		rotate: [0, Math.PI / 180 * 270, 0],
	}],
};