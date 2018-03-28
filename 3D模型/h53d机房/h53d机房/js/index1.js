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
		var gl3dview = new mono.Gl3dview3D();
		demo.typeFinder = new mono.QuickFinder(gl3dview.getServa(), 'type', 'client');

		var gleye = new mono.PerspectiveGleye(30, 1.5, 30, 30000);
		gl3dview.setGleye(gleye);

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
		var tooltip = new Tooltip(['BusinessId'], ['000000']);
		document.body.appendChild(tooltip.getView());

		var personLoaded = false;
		//左侧菜单栏
		var buttons = [{
				label: '场景复位',
				icon: 'reset.png',
				clickFunction: function() {
					demo.resetView(gl3dview);
				},
			}, {
				label: '走线管理',
				icon: 'connection.png',
				clickFunction: function() {
					var showing = gl3dview.connectionView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleConnectionView(gl3dview);
					}
				}
			},
			{
				label: '添加机柜',
				icon: 'add.png',
				clickFunction: function() {
					demo.resetView(gl3dview);
					demo.addcabinetfunction(gl3dview);
				}
			}, {
				label: '拖拽机柜',
				icon: 'edit.png',
				clickFunction: function() {
					var showing = gl3dview.moveView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleMoveView(gl3dview);
					}
				}
			}, {
				label: '温度图',
				icon: 'temperature.png',
				clickFunction: function() {
					var showing = gl3dview.temperatureView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleTemperatureView(gl3dview);
					}
				}
			}, {
				label: '可用空间',
				icon: 'space.png',
				clickFunction: function() {
					var showing = gl3dview.spaceView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleSpaceView(gl3dview);
					}
				}
			}, {
				label: '机柜利用率',
				icon: 'usage.png',
				clickFunction: function() {
					var showing = gl3dview.usageView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleUsageView(gl3dview);
					}
				}
			}, {
				label: '空调风向',
				icon: 'air.png',
				clickFunction: function() {
					var showing = gl3dview.airView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleAirView(gl3dview);
					}
				}
			}, {
				label: '防盗监测',
				icon: 'security.png',
				clickFunction: function() {
					var showing = gl3dview.laserView;
					demo.resetView(gl3dview);
					if(!showing) {
						demo.toggleLaserView(gl3dview);
					}
				}
			},
			{
						label: '供电电缆',
						icon: 'power.png',
						clickFunction: function(){			
							var showing=gl3dview.powerView;
							demo.resetView(gl3dview);
							if(!showing){
								demo.togglePowerView(gl3dview);
							}
						}
					}
		];
		demo.setupToolbar(buttons);

		mono.Utils.autoAdjustGl3dviewBounds(gl3dview, document.documentElement, 'clientWidth', 'clientHeight');
		//鼠标双击方法
		gl3dview.getRootView().addEventListener('dblclick', function(e) {
			demo.handleDoubleClick(e, gl3dview);
		});
		//鼠标单击方法
		/*gl3dview.getRootView().addEventListener('click', function(e) {
			demo.handleClick(e, gl3dview);
		});*/

		demo.setupLights(gl3dview.getServa());
		gl3dview.getServa().getAlarmBox().addServaChangeListener(function(e) {
			var alarm = e.data;
			if(e.kind === 'add') {
				var node = gl3dview.getServa().getDataById(alarm.getElementId());
				node.setStyle('m.alarmColor', null);
			}
		});

		gl3dview.getServa().addDataPropertyChangeListener(function(e) {
			var element = e.source,
				property = e.property,
				oldValue = e.oldValue,
				newValue = e.newValue;
			if(property == 'position' && gl3dview.moveView) {
				if(oldValue.y != newValue.y) {
					element.setPositionY(oldValue.y);
				}
			}

		});

		gl3dview.addInteractionListener(function(e) {
			if(e.kind == 'liveMoveEnd') {
				demo.dirtyShadowMap(gl3dview);
			}
		});

		var time1 = new Date().getTime();
		demo.loadData(gl3dview);
		var time2 = new Date().getTime();
		console.log('time:  ' + (time2 - time1));

		demo.startSmokeAnimation(gl3dview);
		demo.startFpsAnimation(gl3dview);
		demo.resetGleye(gl3dview);
	},

	resetGleye: function(gl3dview) {
		gl3dview.getGleye().setPosition(2000, 1200, 3000);
		gl3dview.getGleye().lookAt(new mono.XiangliangThree(0, 0, 0));
	},

	dirtyShadowMap: function(gl3dview) {
		var floor = gl3dview.getServa().shadowHost;
		var floorCombo = demo.typeFinder.findFirst('floorCombo');
		demo.updateShadowMap(floorCombo, floor, floor.getId(), gl3dview.getServa());
	},

	togglePersonVisible: function(visible, gl3dview) {
		var gleye = gl3dview.getGleye();
		var databox = gl3dview.getServa();
		if(!visible) {
			this.loadObj(gleye, databox);
		} else {
			this.removeObj(databox);
		}
	},

	removeObj: function(box) {
		var person = demo.typeFinder.find('person').get(0);
		person.animate.stop();
		box.removeByDescendant(person);

		var trail = demo.typeFinder.find('trail').get(0);
		box.removeByDescendant(trail);
	},

	loadObj: function(gleye, box) {
		var obj = demo.getRes('worker.obj');
		var mtl = demo.getRes('worker.mtl');

		var loader = new mono.OBJMTLLoader();
		loader.load(obj, mtl, { 'worker': demo.getRes('worker.png'), }, function(object) {
			object.setScale(3, 3, 3);
			object.setClient('type', 'person');
			box.addByDescendant(object);

			var updater = function(element) {
				if(element && element.getChildren()) {
					element.getChildren().forEach(function(child) {
						child.setStyle('m.normalType', mono.NormalTypeSmooth);
						updater(child);
					});
				}
			}
			updater(object);

			var x = -650,
				z = 600,
				angle = 0;
			object.setPosition(x, 0, z);
			object.setRotationY(angle);
			var points = [
				[650, 600],
				[650, -300],
				[130, -300],
				[130, -600],
				[-650, -600],
				[-650, 580],
				[-450, 580],
				[-400, 550]
			];
			object.animate = demo.createPathAnimates(gleye, object, points); //, true);//, true, 0);
			object.animate.play();

			var path = new mono.Path();
			path.moveTo(object.getPositionX(), object.getPositionZ());
			for(var i = 0; i < points.length; i++) {
				path.lineTo(points[i][0], points[i][1]);
			}
			path = mono.PathNode.prototype.adjustPath(path, 20);

			var trail = new mono.PathCube(path, 10, 3);
			trail.s({
				'm.type': 'phong',
				'm.specularStrength': 30,
				'm.color': '#298A08',
				'm.ambient': '#298A08',
				'm.texture.image': demo.getRes('flow.jpg'),
				'm.texture.repeat': new mono.XiangliangTwo(150, 1),
			});
			trail.setRotationX(Math.PI);
			trail.setPositionY(5);
			trail.setClient('type', 'trail');
			box.add(trail);
		});
	},

	createPathAnimates: function(gleye, element, points, loop, finalAngle) {
		var animates = [];

		if(points && points.length > 0) {
			var x = element.getPositionX();
			var z = element.getPositionZ();
			var angle = element.getRotationY();

			var createRotateAnimate = function(gleye, element, toAngle, angle) {
				if(toAngle != angle && toAngle != NaN) {
					if(toAngle - angle > Math.PI) {
						toAngle -= Math.PI * 2;
					}
					if(toAngle - angle < -Math.PI) {
						toAngle += Math.PI * 2;
					}
					//console.log(angle, toAngle);
					var rotateAnimate = new twaver.Animate({
						from: angle,
						to: toAngle,
						type: 'number',
						dur: Math.abs(toAngle - angle) * 300,
						easing: 'easeNone',
						onUpdate: function(value) {
							element.setRotationY(value);
						},
					});
					rotateAnimate.toAngle = toAngle;
					return rotateAnimate;
				}
			}

			for(var i = 0; i < points.length; i++) {
				var point = points[i];
				var x1 = point[0];
				var z1 = point[1];
				var rotate = Math.atan2(-(z1 - z), x1 - x);

				var rotateAnimate = createRotateAnimate(gleye, element, rotate, angle);
				if(rotateAnimate) {
					animates.push(rotateAnimate);
					angle = rotateAnimate.toAngle;
				}

				var moveAnimate = new twaver.Animate({
					from: { x: x, y: z },
					to: { x: x1, y: z1 },
					type: 'point',
					dur: Math.sqrt((x1 - x) * (x1 - x) + (z1 - z) * (z1 - z)) * 5,
					easing: 'easeNone',
					onUpdate: function(value) {
						element.setPositionX(value.x);
						element.setPositionZ(value.y);
					},
				});
				animates.push(moveAnimate);

				x = x1;
				z = z1;
			}

			if(finalAngle != undefined && angle != finalAngle) {
				var rotateAnimate = createRotateAnimate(gleye, element, finalAngle, angle);
				if(rotateAnimate) {
					animates.push(rotateAnimate);
				}
			}
		}
		var animate;
		for(var i = 0; i < animates.length; i++) {
			if(i > 0) {
				animates[i - 1].chain(animates[i]);
				if(loop && i == animates.length - 1) {
					animates[i].chain(animate);
				}
			} else {
				animate = animates[i];
			}
		}
		return animate;
	},
	//走线管理方法
	toggleConnectionView: function(gl3dview) {
		gl3dview.connectionView = !gl3dview.connectionView;

		var connectionView = gl3dview.connectionView;
		var box = gl3dview.getServa();
		var connections = demo.typeFinder.find('connection');
		var rails = demo.typeFinder.find('rail');
		connections.forEach(function(connection) {
			connection.setVisible(connectionView);
			if(!connection.billboard) {
				connection.billboard = new mono.Billboard();
				connection.billboard.s({
					'm.texture.image': demo.createConnectionBillboardImage('0'),
					'm.vertical': true,
				});
				connection.billboard.setScale(60, 30, 1);
				connection.billboard.setPosition(400, 230, 330);
				box.add(connection.billboard);
			}
			connection.billboard.setVisible(connectionView);
			if(connection.isVisible()) {
				var offsetAnimate = new twaver.Animate({
					from: 0,
					to: 1,
					type: 'number',
					dur: 1000,
					repeat: Number.POSITIVE_INFINITY,
					reverse: false,
					onUpdate: function(value) {
						connection.s({
							'm.texture.offset': new mono.XiangliangTwo(value, 0),
						});
						if(value === 1) {
							var text = '54' + parseInt(Math.random() * 10) + '.' + parseInt(Math.random() * 100);
							connection.billboard.s({
								'm.texture.image': demo.createConnectionBillboardImage(text),
							});
						}
					},
				});
				offsetAnimate.play();
				connection.offsetAnimate = offsetAnimate;
			} else {
				if(connection.offsetAnimate) {
					connection.offsetAnimate.stop();
				}
			}
		});
		rails.forEach(function(rail) {
			rail.setVisible(connectionView);
		});
	},

	setupLights: function(box) {
		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(0, 1000, -1000);
		box.add(pointLight);

		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(0, 1000, 1000);
		box.add(pointLight);

		var pointLight = new mono.PointLight(0xFFFFFF, 0.3);
		pointLight.setPosition(1000, -1000, 1000);
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

			//lazy load floor shadow map.
			if(shadowHost && shadowHostId) {
				setTimeout(function() { demo.updateShadowMap(combo, shadowHost, shadowHostId, box) }, demo.LAZY_MAX);
			}
		}
	},

	updateShadowMap: function(combo, shadowHost, shadowHostId, box) {
		var shadowMapImage = demo.createShadowImage(box, shadowHost.getWidth(), shadowHost.getDepth());
		var floorTopFaceId = shadowHostId + '-top.m.lightmap.image';
		combo.setStyle(floorTopFaceId, shadowMapImage);
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
				
				//判断横向弹片的错误变红
				if(number<=2){
					var ID = numbers[num][i].ID;
					if(numbers[num][i].correct=="false"){
						var m ="";
						 m = i;
					}
				}
				var numberchild = numbers[num][i].numberchild;
				var pic = 'server' + number + '.jpg';
				if(number === 3) {
					pic = 'server3.png';
				}
				//单片机错误机版变成红色
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
		if(pic == 'server3.png') {
			var serverColor = '#FFFFFF';
			serverPanel.s({
				'm.color': serverColor,
				'm.ambient': serverColor,
			});
		}

		var server = new mono.ComboNode([serverBody, serverPanel], ['+']);
		//横行片的弹缩
		server.setClient('animation', 'pullOut.z');
		server.setNames(ID);//横行片添加ID
		server.setPosition(0.5, 0, -5);
		box.add(server);
		
		if(pic == 'server3.png') {
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
		/*marker(context, '阿里巴巴', '192.168.1.100', 530, 500);
		marker(context, '乐视', '192.168.1.150', 590, 1000);
		marker(context, '亚马逊', 'ip待分配', 1020, 1000);*/

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
							demo.showDialog(div, "描述", 610, 280);
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
	//温度管理方法
	toggleTemperatureView: function(gl3dview) {
		gl3dview.temperatureView = !gl3dview.temperatureView;

		gl3dview.getServa().forEach(function(element) {
			var type = element.getClient('type');

			if(type === 'rack' || type === 'rack.door') {
				element.setVisible(!gl3dview.temperatureView);
				if(type === 'rack') {
					if(!element.temperatureFake) {
						var fake = new mono.Cube(element.getWidth(), element.getHeight(), element.getDepth());
						element.temperatureFake = fake;
						var sideImage = demo.createSideTemperatureImage(element, 3 + Math.random() * 10);
						fake.s({
							'm.texture.image': sideImage,
							'top.m.texture.image': element.getStyle('top.m.texture.image'),
							'top.m.normalmap.image': demo.getRes('metal_normalmap.jpg'),
							'top.m.specularmap.image': element.getStyle('top.m.texture.image'),
							'top.m.envmap.image': demo.getEnvMap(),
							'top.m.type': 'phong',
						});
						gl3dview.getServa().add(fake);
					}
					element.temperatureFake.setPosition(element.getPosition());
					element.temperatureFake.setVisible(gl3dview.temperatureView);
				}
			}
		});
		if(gl3dview.temperatureView) {
			demo.createTemperatureBoard(gl3dview.getServa());
			demo.createTemperatureWall(gl3dview.getServa());
		} else {
			gl3dview.getServa().remove(gl3dview.getServa().temperaturePlane);
			delete gl3dview.getServa().temperaturePlane;
			gl3dview.getServa().remove(gl3dview.getServa().temperatureWall);
			delete gl3dview.getServa().temperatureWall;
		}
	},

	createTemperatureBoard: function(box) {
		var floor = box.shadowHost;
		var board = new TemperatureBoard(512, 512, 'h', 20);

		box.forEach(function(element) {
			var type = element.getClient('type');
			if(type === 'rack') {
				var x = element.getPositionX() / floor.getWidth() * 512 + 256;
				var y = element.getPositionZ() / floor.getDepth() * 512 + 256;
				var value = 0.1 + Math.random() * 0.3;
				var width = element.getWidth() / floor.getWidth() * 512;
				var depth = element.getDepth() / floor.getWidth() * 512;

				board.addPoint(x - width / 2, y + depth / 2, value);
				board.addPoint(x + width / 2, y + depth / 2, value);
				board.addPoint(x - width / 2, y - depth / 2, value);
				board.addPoint(x + width / 2, y - depth / 2, value);
				board.addPoint(x, y, value);
			}
		});

		var image = board.getImage();

		var plane = new mono.Plane(floor.getWidth(), floor.getDepth());
		plane.s({
			'm.texture.image': image,
			'm.transparent': true,
			'm.side': mono.DoubleSide,
			'm.type': 'phong',
		});
		plane.setPositionY(10);
		plane.setRotationX(-Math.PI / 2);
		box.add(plane);

		box.temperaturePlane = plane;
	},

	createTemperatureWall: function(box) {
		var cube = new mono.Cube(990, 200, 10);
		cube.s({
			'm.visible': false,
		});
		cube.s({
			'front.m.visible': true,
			'm.texture.image': demo.getRes('temp1.jpg'),
			'm.side': mono.DoubleSide,
			'm.type': 'phong',
		});
		cube.setPosition(0, cube.getHeight() / 2, 400);
		cube.setRotationX(Math.PI);
		box.add(cube);

		box.temperatureWall = cube;
	},

	createSideTemperatureImage: function(rack, count) {
		var width = 2;
		var height = rack.getHeight();
		var step = height / count;
		var board = new TemperatureBoard(width, height, 'v', height / count);

		for(var i = 0; i < count; i++) {
			var value = 0.3 + Math.random() * 0.2;
			if(value < 4) {
				value = Math.random() * 0.9;
			}
			board.addPoint(width / 2, step * i, value);
		};

		return board.getImage();
	},
	//可用空间方法
	toggleSpaceView: function(gl3dview) {
		gl3dview.spaceView = !gl3dview.spaceView;

		gl3dview.getServa().forEach(function(element) {
			var type = element.getClient('type');

			if(type === 'rack' || type === 'rack.door') {
				element.setVisible(!gl3dview.spaceView);
				if(type === 'rack') {
					if(!element.spaceCubes) {
						element.spaceCubes = demo.createRackSpaceCubes(gl3dview.getServa(), element);
					}
					for(var i = 0; i < element.spaceCubes.length; i++) {
						element.spaceCubes[i].setPosition(element.getPositionX(),
							element.spaceCubes[i].getPositionY(),
							element.getPositionZ());
						element.spaceCubes[i].setVisible(gl3dview.spaceView);
					}
				}
			}
		});
	},

	createRackSpaceCubes: function(box, rack) {
		var cubes = [];
		var width = rack.getWidth();
		var height = rack.getHeight();
		var depth = rack.getDepth();

		var total = 42;
		var step = height / total;
		var index = 0;

		var colors = ['#8A0808', '#088A08', '#088A85', '#6A0888', '#B18904'];

		var solid = false;
		while(index < 42) {
			var size = parseInt(1 + Math.random() * 5);
			solid = !solid;
			var color = solid ? colors[size - 1] : '#A4A4A4';
			if(solid) {
				size *= 2;
			} else {
				size *= 4;
			}
			if(index + size > total) {
				size = total - index;
			}

			var cube = new mono.Cube(width, step * size - 2, depth);
			var y = (index + size / 2) * step;
			cube.setPosition(rack.getPositionX(), y, rack.getPositionZ());
			cube.s({
				'm.type': 'phong',
				'm.color': color,
				'm.ambient': color,
				'm.specularStrength': 50,
			});
			if(solid) {
				cube.s({
					'm.transparent': true,
					'm.opacity': 0.6,
				});
			}
			box.add(cube);
			cubes.push(cube);

			index += size;
		}
		return cubes;
	},
	//机柜利用率
	toggleUsageView: function(gl3dview) {
		//datajson
		var json = demo.filterJson(gl3dview.getServa(), dataJson.objects);
		var ratiogrou = [];
		for(var i=0;i<json.length;i++){
			if(json[i].type=="rack"){
				var num = json[i].label.slice(1) * 1;
				var numbers = json[i].numbers[num];
				var maths = ""
				for(var j=0;j<numbers.length;j++){
					if(numbers[j].nubner=="1"){
						maths = maths*1 +8.89;
					} else if(numbers[j].nubner=="2"){
						maths = maths*1 +13.335;
					} else if(numbers[j].nubner=="3"){
						maths = maths*1 +26.65;
					}
				}
				ratiogrou.push(maths);
			}
		}
		
		gl3dview.usageView = !gl3dview.usageView;

		var nummath = 0;
		gl3dview.getServa().forEach(function(element) {
			var type = element.getClient('type');
	
			if(type === 'rack' || type === 'rack.door') {
				element.setVisible(!gl3dview.usageView);
				if(type === 'rack') {
					if(!element.usageFakeTotal) {
						var usage = ratiogrou[nummath]/160;
						nummath = nummath+1;
						var color = demo.getHSVColor((1 - usage) * 0.7, 0.7, 0.7);

						var usageFakeTotal = new mono.Cube(element.getWidth(), element.getHeight(), element.getDepth());
						element.usageFakeTotal = usageFakeTotal;
						usageFakeTotal.s({
							'm.wireframe': true,
							'm.transparent': true,
							'm.opacity': 0.2,
						});
						usageFakeTotal.setPosition(element.getPosition());
						gl3dview.getServa().add(usageFakeTotal);

						var height = element.getHeight() * usage;

						var usageFakeUsed = new mono.Cube(element.getWidth(), 0, element.getDepth());
						element.usageFakeUsed = usageFakeUsed;
						usageFakeUsed.s({
							'm.type': 'phong',
							'm.color': color,
							'm.ambient': color,
							'm.specularStrength': 20,
							'left.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
							'right.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
							'back.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
							'front.m.lightmap.image': demo.getRes('inside_lightmap.jpg'),
						});
						usageFakeUsed.setPosition(element.getPosition());
						usageFakeUsed.setPositionY(0);
						gl3dview.getServa().add(usageFakeUsed);

						var usageAnimation = new twaver.Animate({
							from: 0,
							to: height,
							type: 'number',
							dur: 2000,
							delay: Math.random() * 200,
							easing: 'bounceOut',
							onUpdate: function(value) {
								usageFakeUsed.setHeight(value);
								usageFakeUsed.setPositionY(usageFakeUsed.getHeight() / 2);
							},
						});
						element.usageAnimation = usageAnimation;
					}

					element.usageFakeTotal.setVisible(gl3dview.usageView);
					element.usageFakeUsed.setVisible(gl3dview.usageView);
					element.usageFakeTotal.setPosition(element.getPosition().clone());
					element.usageFakeUsed.setHeight(0);
					element.usageFakeUsed.setPosition(element.getPosition().clone());
					element.usageFakeUsed.setPositionY(0);

					if(gl3dview.usageView) {
						element.usageAnimation.play();
					} else {
						element.usageAnimation.stop();
					}
				}
			}
		});
	},
	//空调方向
	toggleAirView: function(gl3dview) {
		gl3dview.airView = !gl3dview.airView;

		if(!gl3dview.getServa().airPlanes) {
			gl3dview.getServa().airPlanes = demo.createAirPlanes();
		}

		for(var i = 0; i < gl3dview.getServa().airPlanes.length; i++) {
			var plane = gl3dview.getServa().airPlanes[i];
			if(gl3dview.airView) {
				gl3dview.getServa().add(plane);
				plane.airAnimation.play();
			} else {
				gl3dview.getServa().remove(plane);
				plane.airAnimation.stop();
			}
		}
	},
	//拖拽机柜方法
	toggleMoveView: function(gl3dview) {
		gl3dview.getServa().getSelectionContainer().clearSelection();
		gl3dview.moveView = !gl3dview.moveView;
		gl3dview.dirtyGl3dview();
	},
	//添加机柜方法
	addcabinetfunction: function(gl3dview) {
		dataJson.objects[8].translates.push([-50, 0, -30]);
		demo.toggleMoveView(gl3dview);
		demo.loadData(gl3dview)
	},

	/* h, s, v (0 ~ 1) */
	getHSVColor: function(h, s, v) {
		var r, g, b, i, f, p, q, t;
		if(h && s === undefined && v === undefined) {
			s = h.s, v = h.v, h = h.h;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch(i % 6) {
			case 0:
				r = v, g = t, b = p;
				break;
			case 1:
				r = q, g = v, b = p;
				break;
			case 2:
				r = p, g = v, b = t;
				break;
			case 3:
				r = p, g = q, b = v;
				break;
			case 4:
				r = t, g = p, b = v;
				break;
			case 5:
				r = v, g = p, b = q;
				break;
		}
		var rgb = '#' + this.toHex(r * 255) + this.toHex(g * 255) + this.toHex(b * 255);
		return rgb;
	},

	toHex: function(value) {
		var result = parseInt(value).toString(16);
		if(result.length == 1) {
			result = '0' + result;
		}
		return result;
	},

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
		div.style.left = '100px';
		div.style.top = '100px';
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

	createConnectionBillboardImage: function(value) {
		var width = 512,
			height = 256;
		var text = '当前网络流量';
		var canvas = document.createElement('canvas');
		canvas['width'] = width;
		canvas['height'] = height;
		var context = canvas.getContext('2d');
		context.fillStyle = '#FE642E';
		context.fillRect(0, 0, width, height - height / 6);

		context.beginPath();
		context.moveTo(width * 0.2, 0);
		context.lineTo(width / 2, height);
		context.lineTo(width * 0.8, 0);
		context.fill();

		var color = 'white';
		context.font = 40 + 'px "Microsoft Yahei" bold';
		context.fillStyle = color;
		context.textAlign = 'left';
		context.textBaseline = 'middle';
		context.fillText(text, height / 10, height / 5);

		var color = 'white';
		text = value;
		context.font = 100 + 'px "Microsoft Yahei" bold';
		context.fillStyle = color;
		context.textAlign = 'left';
		context.textBaseline = 'middle';
		context.fillText(text, height / 10, height / 2);
		context.strokeStyle = color;
		context.lineWidth = 4;
		context.strokeText(text, height / 10, height / 2);

		text = 'Mb/s';
		context.font = 50 + 'px "Microsoft Yahei" bold';
		context.fillStyle = color;
		context.textAlign = 'right';
		context.textBaseline = 'middle';
		context.fillText(text, width - height / 10, height / 2 + 20);

		return canvas;
	},

	resetView: function(gl3dview) {
		demo.resetGleye(gl3dview);

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

		//重置所有视图
		if(gl3dview.temperatureView) {
			demo.toggleTemperatureView(gl3dview);
		}
		if(gl3dview.spaceView) {
			demo.toggleSpaceView(gl3dview);
		}
		if(gl3dview.usageView) {
			demo.toggleUsageView(gl3dview);
		}
		if(gl3dview.airView) {
			demo.toggleAirView(gl3dview);
		}
		if(gl3dview.moveView) {
			demo.toggleMoveView(gl3dview);
		}
		if(gl3dview.connectionView) {
			demo.toggleConnectionView(gl3dview);
		}
		if(gl3dview.laserView) {
			demo.toggleLaserView(gl3dview);
		}
		if(gl3dview.powerView) {
			demo.togglePowerView(gl3dview);
		}
	},

	resetRackPosition: function(gl3dview) {
		//reset all rack position
		gl3dview.getServa().forEach(function(element) {
			if(element.getClient('type') === 'rack') {
				element.setPosition(element.getClient('origin'));
			}
		});
		demo.dirtyShadowMap(gl3dview);
	},

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
		demo.showDialog(div, "门禁信息", 410, 260);

	},

	startSmokeAnimation: function(gl3dview) {
		setInterval(demo.updateSmoke(gl3dview), 200);
	},

	startFpsAnimation: function(gl3dview) {
		var span = document.createElement('span');
		span.style.display = 'block';
		span.style['color'] = 'white';
		span.style['font-size'] = '10px';
		span.style.position = 'absolute';
		span.style.left = '10px';
		span.style.top = '10px';
		span.style.visibility = 'hidden';
		document.body.appendChild(span);
		gl3dview.fpsDiv = span;

		demo.fps = 0;
		gl3dview.setRenderCallback(function() {
			demo.fps++;
		});
		setInterval(demo.updateFps(gl3dview), 1000);
	},

	/*toggleFpsView: function(gl3dview){							

		
	},*/

	updateSmoke: function(gl3dview) {
		return function() {
			if(gl3dview.smokeView) {
				gl3dview.getServa().forEach(function(element) {
					if(element.getClient('type') === 'smoke' && element.isVisible()) {
						var smoke = element;
						var count = smoke.vertices.length;
						for(var i = 0; i < count; i++) {
							var point = smoke.vertices[i];
							point.y = Math.random() * 200;
							point.x = Math.random() * point.y / 2 - point.y / 4;
							point.z = Math.random() * point.y / 2 - point.y / 4;
						}
						smoke.verticesNeedUpdate = true;
						gl3dview.dirtyGl3dview();
					}
				});
			}
		}
	},

	updateFps: function(gl3dview) {
		return function() {
			gl3dview.fpsDiv.innerHTML = 'FPS:  ' + demo.fps;
			demo.fps = 0;
		}
	},

	createWaterLeaking: function(box) {
		var sign = new mono.Billboard();
		sign.s({
			'm.texture.image': demo.getRes('alert.png'),
			'm.vertical': true,
		});
		sign.setScale(80, 160, 1);
		sign.setPosition(50, 90, 50);
		box.add(sign);

		var ball = new mono.Sphere(30);
		ball.s({
			'm.transparent': true,
			'm.opacity': 0.8,
			'm.type': 'phong',
			'm.color': '#58FAD0',
			'm.ambient': '#81BEF7',
			'm.specularStrength': 50,
			'm.normalmap.image': demo.getRes('rack_inside_normal.jpg'),
		});
		ball.setPosition(50, 0, 50);
		ball.setScale(1, 0.1, 0.7);
		box.add(ball);

		box.waterLeakingObjects = [sign, ball];
	},
	//防盗检测
	toggleLaserView: function(gl3dview) {
		gl3dview.laserView = !gl3dview.laserView;

		gl3dview.getServa().forEach(function(element) {
			if(element.getClient('type') === 'laser') {
				element.setVisible(gl3dview.laserView);
			}
		});
	},
	//左侧菜单栏属性
	setupToolbar: function(buttons) {
		var count = buttons.length;
		var step = 32;

		var div = document.createElement('div');
		div.setAttribute('id', 'toolbar');
		div.style.display = 'block';
		div.style.position = 'absolute';
		div.style.left = '10px';
		div.style.top = '75px';
		div.style.width = '32px';
		div.style.height = (count * step + step) + 'px';
		div.style.background = 'rgba(255,255,255,0.75)';
		div.style['border-radius'] = '5px';
		document.body.appendChild(div);

		for(var i = 0; i < count; i++) {
			var button = buttons[i];
			var icon = button.icon;
			var img = document.createElement('img');
			img.style.position = 'absolute';
			img.style.left = '4px';
			img.style.top = (step / 2 + (i * step)) + 'px';
			img.style['pointer-events'] = 'auto';
			img.style['cursor'] = 'pointer';
			img.setAttribute('src', demo.getRes(icon));
			img.style.width = '24px';
			img.style.height = '24px';
			img.setAttribute('title', button.label);
			img.onclick = button.clickFunction;
			div.appendChild(img);
		}
	},

	togglePowerView: function(gl3dview) {
		if(!gl3dview.powerLineCreated) {
			demo.createPowerLines(gl3dview);
		}
		gl3dview.powerView = !gl3dview.powerView;

		gl3dview.getServa().forEach(function(element) {
			var type = element.getClient('type');
			if(type === 'power_line') {
				element.setVisible(gl3dview.powerView);
			}
		});
	},

	createPowerLines: function(gl3dview) {
		var box = gl3dview.getServa();

		var createRackLines = function(labels, offsetZ) {
			box.forEach(function(element) {
				if(element.getClient('type') === 'rack') {
					var label = element.getClient('label');
					if(labels.indexOf(label) > -1) {
						var position = element.getPosition();
						var points = [];
						points.push([position.x, position.y, position.z]);
						points.push([position.x, position.y, position.z - 60]);
						points.push([position.x, 240, position.z - 60]);
						points.push([position.x, 240, offsetZ]);
						points.push([-550, 240, offsetZ]);
						demo.createPathLink(box, points, '#FE9A2E', 'power_line');

						var points = [];
						points.push([position.x - 5, position.y, position.z]);
						points.push([position.x - 5, position.y, position.z - 60]);
						points.push([position.x - 5, 250, position.z - 60]);
						points.push([position.x - 5, 250, offsetZ]);
						points.push([-550, 250, offsetZ]);
						demo.createPathLink(box, points, 'cyan', 'power_line');

						offsetZ -= 5;
					}
				}
			});
		}
	},

	createPathLink: function(box, points, color, clientType) {
		if(points && points.length > 1) {
			color = color || 'white';
			for(var i = 1; i < points.length; i++) {
				var from = points[i - 1];
				var to = points[i];

				var fromNode = new mono.Cube(0.001, 0.001, 0.001);
				fromNode.s({
					'm.color': color,
				})
				fromNode.setPosition(from[0], from[1], from[2]);
				fromNode.setClient('type', clientType);
				box.add(fromNode);

				var toNode = fromNode.clone();
				toNode.setPosition(to[0], to[1], to[2]);
				toNode.setClient('type', clientType);
				box.add(toNode);

				var link = new mono.Link(fromNode, toNode);
				link.s({
					'm.color': color,
				});
				link.setClient('type', clientType);
				box.add(link);
			}
		}
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

demo.registerFilter('floor_box', function(box, json) {
	return {
		type: 'cube',
		width: 100,
		height: 100,
		depth: 100,
		shadow: true,
		sideColor: '#C3D5EE',
		topColor: '#D6E4EC',
		client: {
			type: 'floor_box'
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
	var datas = json.datas;
	var labels = json.labels || [];
	var numbers = json.numbers;
	/*var numberchild = */
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
			var data = datas[i];
			var label = labels[i] || '';
			var rack = {
				type: 'rack',
				shadow: true,
				translate: translate,
				severity: severity,
				data: data,
				label: label,
			};
			demo.copyProperties(json, rack, ['type', 'translates', 'translate', 'severities']);
			objects.push(rack);
		}
	}
	/*console.log(severities)*/

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

demo.registerFilter('rail', function(box, json) {
	var params = {
		type: 'path',
		width: 50,
		height: 8,
		data: json.data,
	};

	var loader = function(box, params) {
		box.add(demo.createRail(params));
	};

	var loaderFunc = function(box, params) {
		return function() {
			loader(box, params);
		};
	};
	setTimeout(loaderFunc(box, params), demo.getRandomLazyTime());
});

demo.createRail = function(params) {
	var rail = demo.createPathObject(params);
	rail.s({
		'm.texture.image': demo.getRes('rail.png'),
		'm.type': 'phong',
		'm.transparent': true,
		'm.color': '#CEECF5',
		'm.ambient': '#CEECF5',
		'aside.m.visible': false,
		'zside.m.visible': false,
		'm.specularStrength': 50,
	});
	rail.setPositionY(263);
	rail.setClient('type', 'rail');
	rail.setVisible(false);

	return rail;
}

demo.registerFilter('connection', function(box, json) {
	var path = demo.create3DPath(json.data);
	path = mono.PathNode.prototype.adjustPath(path, 5);
	var color = json.color;
	var flow = json.flow;
	var y = json.y;

	var loader = function(box, path, color, flow, y) {
		box.add(demo.createConnection(path, color, flow, y));
	};

	var loaderFunc = function(box, path, color, flow, y) {
		return function() {
			loader(box, path, color, flow, y);
		};
	};
	setTimeout(loaderFunc(box, path, color, flow, y), demo.getRandomLazyTime());
});

demo.createConnection = function(path, color, flow, y) {
	var connection = new mono.PathNode(path, 100, 1);
	connection.s({
		'm.type': 'phong',
		'm.specularStrength': 30,
		'm.color': color,
		'm.ambient': color,
		'm.texture.image': demo.getRes('flow.jpg'),
		'm.texture.repeat': new mono.XiangliangTwo(200, 1),
		'm.texture.flipX': flow > 0,
	});
	connection.setClient('flow', flow);
	connection.setStartCap('plain');
	connection.setEndCap('plain');
	connection.setPositionY(y);
	connection.setClient('type', 'connection');
	connection.setVisible(false);
	return connection;
};

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

demo.registerShadowPainter('floor_box', function(object, context, floorWidth, floorHeight, translate, rotate) {
	var translateX = floorWidth / 2 + translate.x;
	var translateY = floorHeight / 2 + translate.z;
	var width = object.getWidth();
	var lineWidth = object.getDepth();

	context.save();

	context.translate(translateX, translateY);
	context.rotate(rotate);

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
demo.registerShadowPainter('extinguisher', demo.createRoundShadowPainter(7));

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

	var data = json.data;
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

	var labelCanvas = demo.generateAssetImage(label);
	rack.setStyle('top.m.texture.image', labelCanvas);
	rack.setStyle('top.m.specularmap.image', labelCanvas);
	rack.setClient('label', label);
	rack.setClient('type', 'rack');
	rack.setClient('origin', rack.getPosition().clone());
	rack.setClient('loaded', false);
	rack.setClient('dbl.func', function() {
		var html = "";
		if(data != null) {
			for(var n = 0; n < data.length; n++) {
				html = html + "<tr>" +
					"<td>" + data[n].number + "</td>" +
					"<td>" + data[n].name + "</td>" +
					"<td>" + data[n].brand + "</td>" +
					"<td>" + data[n].model + "</td>" +
					"<td>" + data[n].state + "</td>" +
					"</tr>"
			}
		}
		if(data != null) {
			var div = document.createElement('div');
			div.style['background-color'] = 'rgba(255,255,255,0.85)';
			div.style['font-size'] = '12px';
			div.style['color'] = 'darkslategrey';
			div.style['overflow'] = 'auto';
			div.innerHTML = '<table style="width:100%">' +
				'<thead>' +
				'<tr><th width="80px">设备编号</th><th width="145px">设备类型</th><th width="100px">设备品牌</th><th width="100px">设备型号</th><th>状态</th></tr>' +
				'</thead>' +
				'<tbody>' + html + '</tbody></table>';
			demo.showDialog(div, "警告！", 510, 260);

		} else {
			var div = document.createElement('div');
			div.style['background-color'] = 'rgba(255,255,255,0.85)';
			div.style['font-size'] = '12px';
			div.style['color'] = 'darkslategrey';
			div.style['overflow'] = 'auto';
			div.innerHTML = "数据为空!";
			demo.showDialog(div, "警告！", 510, 260);
		}
	});
	rack.shadow = shadow;

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
			/*'m.texture.image': null,*/
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
		newRack.setClient('dbl.func', function() {
			var html = "";
			if(data != null) {
				for(var n = 0; n < data.length; n++) {
					html = html + "<tr>" +
						"<td>" + data[n].number + "</td>" +
						"<td>" + data[n].name + "</td>" +
						"<td>" + data[n].brand + "</td>" +
						"<td>" + data[n].model + "</td>" +
						"<td>" + data[n].state + "</td>" +
						"</tr>"
				}
			}
			if(data != null) {
				var div = document.createElement('div');
				div.style['background-color'] = 'rgba(255,255,255,0.85)';
				div.style['font-size'] = '12px';
				div.style['color'] = 'darkslategrey';
				div.style['overflow'] = 'auto';
				div.innerHTML = '<table style="width:100%">' +
					'<thead>' +
					'<tr><th width="80px">设备编号</th><th width="145px">设备类型</th><th width="100px">设备品牌</th><th width="100px">设备型号</th><th>状态</th></tr>' +
					'</thead>' +
					'<tbody>' + html + '</tbody></table>';
				demo.showDialog(div, "警告！", 510, 260);
	
			} else {
				var div = document.createElement('div');
				div.style['background-color'] = 'rgba(255,255,255,0.85)';
				div.style['font-size'] = '12px';
				div.style['color'] = 'darkslategrey';
				div.style['overflow'] = 'auto';
				div.innerHTML = "数据为空!";
				demo.showDialog(div, "警告！", 510, 260);
			}
		});
		newRack.oldRack = rack;
		rack.newRack = newRack;
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
	/*wall.setClient('type','glassWall');
	wall.setClient('size', wall.getBizBox().size());
	wall.setClient('translate',translate);
	wall.shadow = true;*/
	box.add(post);
});

demo.registerCreator('extinguisher', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var x = translate[0],
		z = translate[1];
	var arrow = json.arrow;

	var loader = function(box, translate, x, z) {
		var extinguisher = demo.createExtinguisher(box, translate, x, z, arrow);
		box.add(extinguisher);
	}

	var loaderFunc = function(box, translate, x, z, arrow) {
		return function() {
			loader(box, translate, x, z, arrow);
		}
	}
	setTimeout(loaderFunc(box, translate, x, z, arrow), demo.getRandomLazyTime());
});

demo.registerCreator('smoke', function(box, json) {
	var translate = json.translate || [0, 0, 0];
	var color = json.color;

	var loader = function(box, translate, color) {
		var smoke = demo.createSmoke(translate, color);
		box.add(smoke);
	}

	var loaderFunc = function(box, translate, color) {
		return function() {
			loader(box, translate, color);
		}
	}
	setTimeout(loaderFunc(box, translate, color), demo.getRandomLazyTime());
});

demo.createSmoke = function(translate, color) {
	var x = translate[0],
		y = translate[1],
		z = translate[2];
	var smoke = new mono.Particle();
	var count = 300;
	for(var i = 0; i < count; i++) {
		smoke.vertices.push(new mono.XiangliangThree());
	}

	smoke.verticesNeedUpdate = true;
	smoke.sortParticles = false;
	smoke.setStyle('m.size', 20);
	smoke.setStyle('m.transparent', true);
	smoke.setStyle('m.opacity', 0.5);
	smoke.setStyle('m.texture.image', demo.getRes('smoking.png'));
	smoke.setStyle('m.color', color);
	smoke.setStyle('m.depthTest', false);

	smoke.setClient('type', 'smoke');

	smoke.setVisible(false);
	smoke.setPosition(x, y, z);
	return smoke;
}

demo.createExtinguisher = function(box, translate, x, z, arrow) {
	var body = new mono.Cylinder(8, 8, 50, 20);
	body.setPositionY(body.getHeight() / 2);
	body.s({
		'side.m.texture.image': demo.getRes('fire_extinguisher_side.jpg'),
		'm.type': 'phong',
		'm.specularStrength': 50,
	});
	body.shadow = true;
	body.setClient('type', 'extinguisher');
	body.setPosition(x, body.getHeight() / 2, z);
	box.add(body);

	var top = new mono.Sphere(8, 20);
	top.setParent(body);
	top.setPositionY(body.getHeight() / 2);
	top.setScaleY(0.5);
	top.s({
		'm.color': '#DF0101',
		'm.ambient': '#DF0101',
		'm.type': 'phong',
		'm.specularStrength': 50,
	});
	box.add(top);

	var nozzle = new mono.Cylinder(2, 3, 10);
	nozzle.setParent(top);
	nozzle.setPositionY(top.getRadius());
	nozzle.s({
		'm.color': 'orange',
		'm.ambient': 'orange',
		'm.type': 'phong',
	});
	box.add(nozzle);

	var handleA = new mono.Cube(14, 1, 3);
	handleA.setParent(nozzle);
	handleA.setPositionY(nozzle.getHeight() - 3);
	handleA.setPositionX(handleA.getWidth() / 2 - 2);
	handleA.setRotationZ(Math.PI / 180 * 45);
	handleA.s({
		'm.texture.image': demo.getRes('metal.png'),
		'm.type': 'phong',
	});
	box.add(handleA);

	var handleB = new mono.Cube(14, 1, 3);
	handleB.setParent(nozzle);
	handleB.setPositionY(nozzle.getHeight() - 8);
	handleB.setPositionX(handleB.getWidth() / 2);
	handleB.setRotationZ(Math.PI / 180 * -10);
	handleB.s({
		'm.texture.image': demo.getRes('metal.png'),
		'm.type': 'phong',
	});
	box.add(handleB);

	var path = new mono.Path();
	path.moveTo(0, 0, 0);
	path.curveTo(-10, 0, 0, -15, -10, 0);
	path.curveTo(-20, -20, 0, -15, -55, 0);
	var pipe = new mono.PathNode(path, 50, 2, 10, 'round', 'round');
	pipe.setParent(nozzle);
	pipe.s({
		'm.texture.image': demo.getRes('metal.png'),
		'm.type': 'phong',
	});
	box.add(pipe);

	if(arrow) {
		var count = 6;
		var height = 60;
		var planes = [];
		for(var i = 0; i < count; i++) {
			var plane = new mono.Plane(height / 2, height);
			plane.s({
				'm.texture.image': demo.getRes('down.png'),
				'm.transparent': true,
				'm.side': mono.DoubleSide,
				'm.type': 'phong',
			});
			plane.setParent(nozzle);
			plane.setPositionY(height + i * height);
			plane.setVisible(false);
			plane.setClient('type', 'extinguisher_arrow');
			box.add(plane);
			planes.push(plane);

			planes.index = 10000;
		}

		var func = function() {
			if(planes[0].isVisible()) {
				planes.index--;
				if(planes.index == 0) {
					planes.index = 10000;
				}
				var offset = planes.index % count;
				for(var i = count - 1; i >= 0; i--) {
					var plane = planes[i];
					if(i === offset) {
						plane.s({
							'm.color': '#FF8000',
							'm.ambient': '#FF8000',
						});
					} else {
						plane.s({
							'm.color': 'white',
							'm.ambient': 'white',
						});
					}
				}
			}
			setTimeout(func, 200);
		}
		setTimeout(func, 200);
	}
}

demo.registerFilter('gleye', function(box, json) {
	var x = json.translate[0],
		y = json.translate[1],
		z = json.translate[2];
	var angle = json.angle || 0;
	var direction = 130;
	var statevideo = json.statevideo;

	var loader = function(box, x, y, z, angle, direction, statevideo) {
		var gleye = demo.createGleye(box, x, y, z, angle, direction, statevideo);
		box.add(gleye);
	}

	var loaderFunc = function(box, x, y, z, angle, direction, statevideo) {
		return function() {
			loader(box, x, y, z, angle, direction, statevideo);
		}
	}
	setTimeout(loaderFunc(box, x, y, z, angle, direction, statevideo), demo.getRandomLazyTime());
});

demo.createGleye = function(box, x, y, z, angle, direction, statevideo) {
	var body = new mono.Cylinder(4, 4, 15);
	body.s({
		'm.texture.image': demo.getRes('bbb.png'),
		'top.m.texture.image': demo.getRes('camera.png'),
		'bottom.m.texture.image': demo.getRes('eee.png'),
		'm.type': 'phong',
	});

	var style = {
		'side.m.normalType': mono.NormalTypeSmooth,
	};
	var cover1 = new mono.Cylinder(6, 6, 20);
	cover1.s(style);
	var cover2 = new mono.Cylinder(5, 5, 20);
	cover2.s(style);
	var cover3 = new mono.Cube(10, 20, 10);
	var path = new mono.Path();
	path.moveTo(0, 0, 0);
	path.lineTo(0, -10, 0);
	path.lineTo(0, -11, -1);
	path.lineTo(0, -12, -13);
	path.lineTo(0, -12, -30);

	var gleye = new mono.ComboNode([cover1, cover3, cover2, body], ['+', '-', '+']);
	gleye.s({
		'm.type': 'phong',
		'm.color': '#2E2E2E',
		'm.ambient': '#2E2E2E',
		'm.specularStrength': 50,
	});
	gleye.setRotation(Math.PI / 180 * 100, 0, Math.PI / 180 * angle);
	gleye.setPosition(x, y, z);
	gleye.setClient('type', 'gleye');
	gleye.setClient('dbl.func', function() {
		var video = document.createElement('video');
		video.setAttribute('src', demo.getRes(statevideo));
		video.setAttribute('controls', 'true');
		video.setAttribute('autoplay', 'true');

		demo.showDialog(video, "这是一段视频", 610, 280);
	});

	box.add(gleye);

	var pipe = new mono.PathNode(path, 10, 2, 10, 'plain', 'plain');
	pipe.s({
		'm.color': '#2E2E2E',
		'm.ambient': '#2E2E2E',
		'm.type': 'phong',
		'm.specularStrength': 50,
		'm.normalType': mono.NormalTypeSmooth,
	});
	pipe.setRotationX(-Math.PI / 2);
	pipe.setParent(gleye);

	box.add(pipe);
};

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

demo.createAirPlanes = function() {
	var planes = [];
	var wavePath = new mono.Path();
	wavePath.moveTo(0, 0, 0);
	wavePath.curveTo(0, 80, 30, 0, 100, 150);
	wavePath.curveTo(0, 120, 200, 0, 200, 230);

	var creator = function(length, x, z) {
		var path = new mono.Path();
		path.moveTo(0, 0, 0);
		path.lineTo(length, 0, 0);
		var curvePlane = new mono.CurvePlane(path, wavePath);
		curvePlane.setPosition(x, 0, z);
		curvePlane.s({
			'm.texture.image': demo.getRes('arrow.png'),
			'm.side': 'both',
			'm.texture.repeat': new mono.XiangliangTwo(parseInt(length / 50), 8),
			'm.transparent': true,
			'm.gradient': { 0: '#84DF29', 0.6: '#DF6029', 1: '#DF2929' },
			'm.gradientType': 2,
		});

		var airAnimation = new twaver.Animate({
			from: 0,
			to: 1,
			dur: 1000,
			reverse: false,
			repeat: Number.POSITIVE_INFINITY,
			onUpdate: function(value) {
				curvePlane.s({
					'm.texture.offset': new mono.XiangliangTwo(0, -value),
				});
			},
		});
		curvePlane.airAnimation = airAnimation;

		return curvePlane;
	}

	planes.push(creator(450, -10, 150));
	planes.push(creator(195, -310, 150));
	planes.push(creator(250, -400, -350));
	return planes;
}

demo.registerFilter('water_cable', function(box, json) {
	var path = demo.create3DPath(json.data);
	path = mono.PathNode.prototype.adjustPath(path, 5);
	var color = json.color;
	var size = json.size;
	var y = json.y;

	var loader = function(box, path, color, size, y) {
		box.add(demo.createWaterCable(path, color, size, y));
	};

	var loaderFunc = function(box, path, color, size, y) {
		return function() {
			loader(box, path, color, size, y);
		};
	};
	setTimeout(loaderFunc(box, path, color, size, y), demo.getRandomLazyTime());
});

demo.createWaterCable = function(path, color, size, y) {
	var cable = new mono.PathNode(path, 100, size);
	cable.s({
		'm.type': 'phong',
		'm.specularStrength': 50,
		'm.color': color,
		'm.ambient': color,
		'm.texture.image': demo.getRes('flow.jpg'),
		'm.texture.repeat': new mono.XiangliangTwo(100, 1),
	});
	cable.setStartCap('plain');
	cable.setEndCap('plain');
	cable.setPositionY(y);
	cable.setClient('type', 'water_cable');
	cable.setVisible(false);
	return cable;
};

demo.registerFilter('laser', function(box, json) {
	var loader = function(box, json) {
		box.add(demo.createLaser(box, json));
	};

	var loaderFunc = function(box, json) {
		return function() {
			loader(box, json);
		};
	};
	setTimeout(loaderFunc(box, json), demo.getRandomLazyTime());
});

demo.createLaser = function(box, json) {
	var angle = Math.atan2(json.to[1] - json.from[1], json.to[0] - json.from[0]);

	var offset = 1.5;
	var fromOffsetZ = offset * Math.sin(angle);
	var fromOffsetX = offset * Math.cos(angle);
	var toOffsetZ = offset * Math.sin(angle + Math.PI);
	var toOffsetX = offset * Math.cos(angle + Math.PI);

	//from side.
	var pole = new mono.Cylinder(5, 5, 170);
	pole.s({
		'm.texture.image': demo.getRes('rack_inside.jpg'),
		'm.texture.repeat': new mono.XiangliangTwo(1, 3),
		'm.color': '#A4A4A4',
		'm.ambient': '#A4A4A4',
		'm.type': 'phong',
		'm.specularStrength': 10,
	});
	pole.setPosition(json.from[0], pole.getHeight() / 2, json.from[1]);
	pole.setClient('type', 'laser');
	pole.setVisible(false);
	box.add(pole);

	var glass = new mono.Cylinder(4, 4, 130);
	glass.s({
		'm.type': 'phong',
		'm.color': '#A9F5D0',
		'm.ambient': '#A9F5D0',
		'm.envmap.image': demo.getEnvMap(),

	});
	glass.setParent(pole);
	glass.setPosition(fromOffsetX, 0, fromOffsetZ);
	glass.setClient('type', 'laser');
	glass.setVisible(false);
	box.add(glass);

	//another side.
	var pole2 = pole.clone();
	pole2.setPosition(json.to[0], pole2.getHeight() / 2, json.to[1]);
	pole2.setClient('type', 'laser');
	pole2.setVisible(false);
	box.add(pole2);

	var glass2 = glass.clone();
	glass2.setParent(pole2);
	glass2.setPosition(toOffsetX, 0, toOffsetZ);
	glass2.setClient('type', 'laser');
	glass2.setVisible(false);
	box.add(glass2);

	//create laser lines.
	var color = 'red';
	for(var i = 0; i < 5; i++) {
		var from = new mono.Cube(1, 1, 1);
		from.s({
			'm.color': color,
			'm.ambient': color,
		});
		from.setPosition(json.from[0], 30 + i * 27, json.from[1]);
		from.setClient('type', 'laser');
		from.setVisible(false);
		box.add(from);

		var to = from.clone();
		to.setPosition(json.to[0], 30 + i * 27, json.to[1]);
		to.setClient('type', 'laser');
		to.setVisible(false);
		box.add(to);

		var link = new mono.Link(from, to);
		link.s({
			'm.color': color,
			'm.ambient': color,
			'm.type': 'phong',
			'm.transparent': true,
			'm.opacity': 0.7,
		});
		link.setClient('type', 'laser');
		link.setVisible(false);
		box.add(link);
	}
};

Tooltip = function(keys, values) {
	this.mainContent = document.createElement('div');
	this.keys = keys;
	this.values = values;
	this.init();
}

twaver.Util.ext('Tooltip', Object, {
	init: function() {
		this.mainContent.setAttribute('class', 'tooltip');
		this.mainContent.setAttribute('id', 'tooltip');
		this.table = document.createElement('table');
		for(var i = 0; i < this.keys.length; i++) {
			var tr = document.createElement('tr');
			var tdKey = document.createElement('td');
			tdKey.setAttribute('class', 'tooltip-key');
			tdKey.innerHTML = this.keys[i];
			tr.appendChild(tdKey);

			var tdValue = document.createElement('td');
			tdValue.setAttribute('class', 'tooltip-value');
			tdValue.innerHTML = this.values[i];
			tr.appendChild(tdValue);
			this.table.appendChild(tr);
		}
		this.mainContent.appendChild(this.table);
	},
	getView: function() {
		return this.mainContent;
	},
	setValues: function(values) {
		this.values = values;
		var children = this.table.childNodes;
		for(var i = 0; i < this.values.length; i++) {
			var value = this.values[i];
			var childGroup = children[i];
			childGroup.lastChild.innerHTML = value;
		}
	}
});

var dataJson = {
	objects: [{
		type: 'floor',
		width: 1600,
		depth: 1300,
	}, {
		type: 'floor_cut',
		width: 200,
		height: 20,
		depth: 260,
		translate: [-348, 0, 530],
		rotate: [Math.PI / 180 * 3, 0, 0],
	}, {
		type: 'floor_box',
		width: 300,
		height: 150,
		depth: 100,
		translate: [350, 0, -500],
	}, {
		type: 'wall',
		height: 200,
		translate: [-500, 0, -500],
		data: [
			[0, 0],
			[1000, 0],
			[1000, 500],
			[500, 500],
			[500, 1000],
			[0, 1000],
			[0, 0]
		],
		children: [{
			type: 'window',
			translate: [200, 30, 500],
			width: 420,
			height: 150,
			depth: 50,
		}, {
			type: 'door',
			width: 205,
			height: 180,
			depth: 26,
			translate: [-350, 0, 500],
		}],
	}, {
		type: 'plants',
		shadow: true,
		translates: [
			[560, 0, 400],
			[560, 0, 0],
			[60, 0, -100],
			[60, 0, -400],
			[-560, 0, 400],
			[-560, 0, 0],
			[-560, 0, -400]
		],
	}, {
		type: 'plants',
		scale: [0.5, 0.3, 0.5],
		shadow: false,
		translates: [
			[100, 27, 520],
			[300, 27, 520]
		],
	}, {
		type: 'glass_wall',
		width: 1300,
		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [-790, 0, 0],
	}, {
		type: 'glass_wall',
		width: 1300,
		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [790, 0, 0],
	}, {
		type: 'racks',
		translates: [
			[-150, 0, 250],
			[-150 - 62, 0, 250],
			[-150 - 62 - 62, 0, 250],
			[-370, 0, -250],
			[-370 + 62, 0, -250],
			[-370 + 62 + 62, 0, -250],
			[-370 + 62 + 62 + 62, 0, -250],
			[150, 0, 250],
			[150 + 62, 0, 250],
			[150 + 62 + 62, 0, 250],
			[150 + 62 + 62 + 62, 0, 250],
			[150 + 62 + 62 + 62 + 62, 0, 250],
			[150 - 62, 0, 250],
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
			[{ ID:"ca4f0323-0851-4b2d-a37a-cd75550d4291",nubner: "1", numberchild: "", correct: "true" },
				{ ID:"ca4f0323-0851-4b2d-a37a-cd75550d4290",nubner: "1", numberchild: "", correct: "false" },
				{ ID:"780ba8bb-3612-4496-a01d-5915560d3b6d",nubner: "1", numberchild: "", correct: "true" },
				{ nubner: "3", numberchild: [
					{ ID: "a553e033-f297-4a17-aadd-eecb10e4cb7c", sime: "1", correct: "true" }, 
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
				{ ID:"701114e7-57d1-429c-8a59-1696d820a695",nubner: "1", numberchild: "", correct: "true" },
				{ nubner: "3", numberchild: [
					{ ID: "e32d1965-3d6e-45c7-ac6c-d317a1954875", sime: "1", correct: "true" }, 
					{ ID: "8e554c41-e910-4565-bd02-bd0e5984ee7e", sime: "2", correct: "true" }, 
					{ ID: "581165df-101a-4a46-8180-3fb76baf5423", sime: "3", correct: "true" }, 
					{ ID: "d22b9838-c378-45cc-8eab-48b875be5532", sime: "1", correct: "true" }, 
					{ ID: "6e52fd6e-f689-4612-b453-bebf23a46d3a", sime: "1", correct: "true" }, 
					{ ID: "fe1b5142-559e-4689-b9d6-0f71a8a77463", sime: "1", correct: "false" }] 
				},
				{ ID:"cdfedd20-f71f-4602-a81b-cb3481ee09de",nubner: "2", numberchild: "", correct: "false" },
				{ nubner: "3", numberchild: [
					{ ID: "670c6755-5c31-4e24-ac50-b3177f217fd5", sime: "1", correct: "true" }, 
					{ ID: "a612406a-a679-48e4-af54-ddef8ba1fc24", sime: "2", correct: "true" }, 
					{ ID: "ea4bdc9e-f35a-48bd-bdd1-5b300314cb25", sime: "3", correct: "true" }, 
					{ ID: "ce5f3cc5-dc46-4d6f-aca9-3dd0a63082e7", sime: "1", correct: "true" }, 
					{ ID: "82ef8c0e-58f4-44f9-81cc-2f739a4972f2", sime: "1", correct: "true" }, 
					{ ID: "405f3489-59d8-4ce5-b9c2-59b24a29c01b", sime: "1", correct: "true" }, 
					{ ID: "16be44c4-e927-4873-8920-d8ff8f3f327c", sime: "2", correct: "true" }, 
					{ ID: "892590ac-df2b-4709-ae10-eaa70d68158e", sime: "2", correct: "true" }] 
				},
				{ nubner: "3", numberchild: [
					{ ID: "676c42f8-fe39-4a2c-8d7b-b4a27466550e", sime: "1", correct: "true" }, 
					{ ID: "c77ac522-67dd-449b-baaa-d3333e441129", sime: "2", correct: "true" }, 
					{ ID: "65a73997-7ce1-417a-ae3b-3c31a44c1fbd", sime: "3", correct: "true" }, 
					{ ID: "d9430b51-43a5-49aa-98b5-a90f7b4661f3", sime: "1", correct: "true" }, 
					{ ID: "451128bd-9b0e-4c33-aec7-ed4641ceccb0", sime: "2", correct: "true" }, 
					{ ID: "1215ddd3-ff6c-4336-8f88-ab2497ebdcde", sime: "3", correct: "true" }, 
					{ ID: "7f9121c3-6b72-4d48-88d6-abff1c5a94cc", sime: "3", correct: "true" }] 
				}
			],
			//A1
			[{ ID:"0ff458ed-c60d-4dd8-aa9f-1a2f6b643771",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"d4906026-ff64-4e88-8eb0-8fbe2a531fac",nubner: "2", numberchild: "", correct: "true" },
			{ nubner: "3", numberchild: [
					{ ID: "b39d1ea7-ca0f-48c2-bede-d0c3d2743f05", sime: "1", correct: "true" }, 
					{ ID: "a40b42a4-83e8-45aa-9d9f-68e5eb90b576", sime: "2", correct: "true" }, 
					{ ID: "72ace8b5-2a5d-4be2-9bf3-a32c07511dec", sime: "3", correct: "true" }, 
					{ ID: "356b205d-6c38-4e97-9dc1-8e6400b7fd0f", sime: "1", correct: "true" }, 
					{ ID: "f8aa8817-4390-49d9-a51b-68bb7b60bf5b", sime: "2", correct: "true" }, 
					{ ID: "b72ebf27-0375-42d6-bce4-fa17a4bffdf0", sime: "3", correct: "true" }, 
					{ ID: "4ac99141-b0fa-4166-8351-6aa1bfba0cac", sime: "3", correct: "true" },
					{ ID: "cde2fb9c-befa-4413-b4ec-c5698a69df40", sime: "3", correct: "true" },
					{ ID: "0599b15c-cd26-47b9-83b6-537d2e86ca32", sime: "1", correct: "true" }, 
					{ ID: "f9fadce2-8eac-47b3-873b-5c5d6212ad66", sime: "2", correct: "true" }, 
					{ ID: "745564f2-4c0d-4cfb-9ecf-ea3c6fb4a23a", sime: "3", correct: "true" }, 
					{ ID: "bea5f551-4e8d-4e53-9690-d5ce1c3e615a", sime: "3", correct: "true" }]
			},
			{ ID:"8bd7958c-a9fd-473d-a6b5-ae0d85833a17",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c2070edf-193c-4fd6-a0e7-506430a479e7",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"724402c9-3961-4864-b93a-09a98b9ff700",nubner: "2", numberchild: "", correct: "true" },
			{ nubner: "3", numberchild: [
					{ ID: "01a58a9a-2779-4007-be3c-b8bdfabe82e8", sime: "1", correct: "true" }, 
					{ ID: "774e6f50-9dc8-44b2-bd80-bc97f659603a", sime: "2", correct: "true" }, 
					{ ID: "ec953ea1-6c20-4446-a58b-d387454b326d", sime: "3", correct: "true" }, 
					{ ID: "123d82f8-e5d4-44a6-adc6-338ef923fc1a", sime: "1", correct: "true" }, 
					{ ID: "518142b8-523a-4466-9292-2d6c89171d41", sime: "2", correct: "true" }, 
					{ ID: "0f239e45-92ec-4dad-8c80-424ed23cb67c", sime: "3", correct: "true" }, 
					{ ID: "fd153ca6-b861-44ab-8ccd-30bb7727299b", sime: "3", correct: "true" },
					{ ID: "2c03ac61-c7aa-48e9-99dd-b13c1a6487b5", sime: "3", correct: "true" },
					{ ID: "146981fd-22b1-4273-b107-88b472be5b85", sime: "1", correct: "true" }, 
					{ ID: "9aa08fda-4bb1-424e-9b7f-7807574d00c6", sime: "2", correct: "true" }, 
					{ ID: "11e24ab3-058d-4403-b39b-9f58b3c729d9", sime: "3", correct: "true" }, 
					{ ID: "d3a41c0d-995a-41d3-8b0e-53bb066dcbfa", sime: "3", correct: "true" }]
			},
			{ ID:"d53a1695-eeb7-4342-9fa4-17500e19a17d",nubner: "2", numberchild: "", correct: "true" },
			{ nubner: "3", numberchild: [
					{ ID: "e74734e4-e49a-4a22-86e2-886087d64c8a", sime: "1", correct: "true" }, 
					{ ID: "61b3aa7c-be60-43ef-bdd0-d01832de01d7", sime: "2", correct: "true" }, 
					{ ID: "b3f13f03-55d9-45c6-bd58-36a3ba12c8ab", sime: "3", correct: "true" }, 
					{ ID: "2dc40324-d44c-4682-8f2e-0edf85a5943d", sime: "1", correct: "true" }, 
					{ ID: "cb9e75e5-722c-4495-b9da-84804b2cf331", sime: "2", correct: "true" }, 
					{ ID: "afe7b83d-e38f-4ff6-b77f-83d046e6937a", sime: "3", correct: "true" }, 
					{ ID: "f2705040-9685-45d2-b126-85712f38f8a3", sime: "3", correct: "true" },
					{ ID: "979a2ac8-1fd3-46fc-9998-1ecfc0c0a52b", sime: "3", correct: "true" },
					{ ID: "47f039d1-0ec8-49b6-a4e6-8d1321ab3ab3", sime: "1", correct: "true" }, 
					{ ID: "75e93886-e790-4703-85c6-957fb9eeb20b", sime: "2", correct: "true" }, 
					{ ID: "9a3ac08e-183c-4a59-92be-447e7683d47a", sime: "3", correct: "true" }, 
					{ ID: "d6707f85-c9e8-4e98-93d9-005be247ffbd", sime: "3", correct: "true" }]
			}],
			//A2
			[{ ID:"3e8bc210-04b7-47af-9967-6a48d3865869",nubner: "1", numberchild: "", correct: "false" },
			{ ID:"f6e302fa-d36e-4db8-b362-c948835d33b9",nubner: "2", numberchild: "", correct: "true" },
			{ nubner: "3", numberchild: [
					{ ID: "04d39585-64a2-427d-8b19-47d71e06c267", sime: "1", correct: "true" }, 
					{ ID: "a640625f-f4b6-4a01-8794-50bb7cecebf6", sime: "2", correct: "true" }, 
					{ ID: "305fb3f2-2b3e-4aca-b610-059404cbd97a", sime: "3", correct: "true" }, 
					{ ID: "1b2094af-de36-4fe2-8d38-a01ae2c4fa02", sime: "1", correct: "true" }, 
					{ ID: "32ec4461-21fc-417a-8c3a-15be103645da", sime: "2", correct: "true" }, 
					{ ID: "d1cec7ee-e675-4c02-b156-1d3ad999114f", sime: "3", correct: "true" }, 
					{ ID: "1fc31e82-8008-4e1e-aee4-e4684edaafa3", sime: "3", correct: "true" },
					{ ID: "7fc5524d-9277-4116-ab72-16ca19128755", sime: "3", correct: "true" },
					{ ID: "f6a13cb1-1546-40c4-90cb-f6abf5e45e18", sime: "1", correct: "true" }, 
					{ ID: "117d6c64-2b82-4d4b-989a-d1e2d496e170", sime: "2", correct: "true" }, 
					{ ID: "7ec3396d-5c98-4c7c-b577-63044efff437", sime: "3", correct: "true" }, 
					{ ID: "fbc21fe5-fd9e-4307-9169-9216078a52c8", sime: "3", correct: "true" }]
			},
			{ ID:"6dddd3b7-620d-48bf-a11d-e12943c0d187",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"2ee8974b-9d6f-4213-8fda-627d9d1e2078",nubner: "1", numberchild: "", correct: "true" },
			{ ID:"c43d6c1e-8cd5-4049-af86-7f832594a893",nubner: "2", numberchild: "", correct: "true" },
			{ nubner: "3", numberchild: [
					{ ID: "11766896-9fc2-46b6-8052-b04acc30c2fa", sime: "1", correct: "true" }, 
					{ ID: "6d539830-9190-402b-a433-a8a9b8320a00", sime: "2", correct: "true" }, 
					{ ID: "4d42a633-69ac-4504-aeb0-21d9735d0cf5", sime: "3", correct: "true" }, 
					{ ID: "237ee21e-8a2a-4fad-80c1-280daf7f984c", sime: "1", correct: "true" }, 
					{ ID: "b5f01f92-de12-4f7f-bb9f-0d228c6503ac", sime: "2", correct: "true" }, 
					{ ID: "ee469a4f-1bce-4d89-a0d7-3ec88f924069", sime: "3", correct: "true" }, 
					{ ID: "5675167a-23bc-4094-989c-9e3c3b651da2", sime: "3", correct: "true" },
					{ ID: "632ba1b3-10bf-42ae-a9e0-6bb638b09c1d", sime: "3", correct: "true" },
					{ ID: "79e1b850-e093-4b8e-84b3-3e0c72fad324", sime: "1", correct: "true" }, 
					{ ID: "94384eb5-62f2-4677-be66-b8d8f4d13641", sime: "2", correct: "true" }, 
					{ ID: "0d8b7ec4-7fe3-4b1f-839d-8e53cda7dc3d", sime: "3", correct: "true" }, 
					{ ID: "8eb96cc4-e186-4817-b571-b8df466e4727", sime: "3", correct: "true" }]
			},
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
		translate: [-130, 100, 513],
	}, {
		type: 'post',
		rotate: [0, Math.PI / 180 * 90, 0],
		translate: [-485, 60, 40],
		width: 80,
		height: 120,
	}, {
		type: 'rail', //行走轨道
		data: [
			[-180, 250],
			[-400, 250],
			[-400, -250],
			[400, -250]
		],
	}, {
		type: 'connection',
		color: '#ED5A00',
		y: 265,
		flow: 0.05,
		data: [
			[-180, -100, -250],
			[-180, -100, -150],
			[-180, -50, -150],
			[-180, -50, -250],
			[-180, 0, -250],
			[-400, 0, -250],
			[-400, 0, 250],
			[400, 0, 250],
			[400, -50, 250],
			[400, -50, 350],
			[400, -100, 350],
			[400, -100, 250],
		],
	}, {
		type: 'connection',
		color: '#21CD43',
		y: 265,
		flow: -0.05,
		data: [
			[-180 + 3, -100, -250],
			[-180 + 3, -100, -150],
			[-180 + 3, -50, -150],
			[-180 + 3, -50, -250 + 3],
			[-180 + 3, 0, -250 + 3],
			[-400 + 3, 0, -250 + 3],
			[-400 + 3, 0, 250 - 3],
			[400 + 3, 0, 250 - 3],
			[400 + 3, -50, 250 - 3],
			[400 + 3, -50, 350],
			[400 + 3, -100, 350],
			[400 + 3, -100, 250],
		],
	}, {
		type: 'gleye', //摄像头
		translate: [80, 200, 30],
		statevideo: "test2.mp4"
	}, {
		type: 'gleye',
		translate: [470, 200, 400],
		angle: 90,
		statevideo: "test.mp4"
	}, {
		type: 'gleye',
		translate: [-450, 200, -470],
		alarm: mono.AlarmSeverity.WARNING,
		statevideo: "test3.mp4"
	}, {
		type: 'extinguisher', //灭火器
		translate: [-45, -470],
	}, {
		type: 'extinguisher',
		translate: [-45, -450],
		arrow: true,
	}, {
		type: 'extinguisher',
		translate: [-45, -430],
	}, {
		type: 'smoke', //烟
		translate: [300, 180, 240],
		color: '#FAAC58',
	}, {
		type: 'smoke',
		translate: [-300, 180, -240],
		color: '#B40431',
	}, {
		type: 'water_cable',
		color: '#B45F04',
		y: 10,
		size: 3,
		data: [
			[50, 0, 50],
			[460, 0, 50],
			[460, 0, 450],
			[-460, 0, 450],
			[-460, 0, -450],
			[-100, 0, -450],
			[-50, 0, -400],
			[-50, 0, 0],
			[0, 0, 50],
			[50, 0, 50],
		],
	}, {
		type: 'water_cable',
		color: '#04B431',
		y: 10,
		size: 3,
		data: [
			[-300, 0, 180],
			[440, 0, 180],
			[440, 0, 330],
			[-340, 0, 330],
			[-340, 0, -180],
			[-420, 0, -180],
			[-420, 0, -310],
			[-120, 0, -310],
			[-120, 0, -180],
			[-320, 0, -180],
		],
	}, {
		type: 'laser',
		from: [-485, 330],
		to: [485, 330],
	}, {
		type: 'laser',
		from: [-485, 0],
		to: [-20, 0],
	}, {
		type: 'laser',
		from: [-80, 480],
		to: [-80, -480],
	}],
};