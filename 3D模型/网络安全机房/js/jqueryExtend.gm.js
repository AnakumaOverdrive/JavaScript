/// <reference path="jquery-1.9.1.js" />
/// <reference path="public.js" />

//数据类型
var dtype = {};

dtype["normal"] = '000';
dtype["000"] = {};
dtype["000"].validexp = /^[a-zA-Z0-9_\u4e00-\u9fa5_\-、。.,，:：;；"“”\/（）+()*\s*]+$/;
dtype["000"].errormsg = '不能包含特殊字符';

dtype["normalstren"] = '001';//字符串只能包含数字字母和下划线
dtype["001"] = {};
dtype["001"].validexp = /^\w+$/gi;
dtype["001"].errormsg = '不能包含特殊字符';

dtype["normalstr"] = '002';
dtype["002"] = {};
dtype["002"].validexp = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
dtype["002"].errormsg = '不能包含特殊字符';

dtype["novalid"] = '009';//不验证
dtype["009"] = {};
dtype["009"].validexp = '';
dtype["009"].errormsg = '';

dtype["num"] = '010';//数字
dtype["010"] = {};
dtype["010"].validexp = /^[0-9]+$/;//验证表达式
dtype["010"].errormsg = '必须为数字';

dtype["int"] = '011';//整数
dtype["011"] = {};
dtype["011"].validexp = /^-?\\d+$/;//验证表达式
dtype["011"].errormsg = '必须为整数';

dtype["intOverZero"] = '012';//正整数
dtype["012"] = {};
dtype["012"].validexp = /^[0-9]*[1-9][0-9]*$/;//验证表达式
dtype["012"].errormsg = '必须为正整数';

dtype["intBelowZero"] = '013';//负整数
dtype["013"] = {};
dtype["013"].validexp = /^-[0-9]*[1-9][0-9]*$/;//验证表达式
dtype["013"].errormsg = '必须为负整数';

dtype["intWithZero"] = '014';//正整数加0
dtype["014"] = {};
dtype["014"].validexp = /^\d+$/;//验证表达式
dtype["014"].errormsg = '必须为非负整数';

dtype["decimal"] = '015';//小数
dtype["015"] = {};
dtype["015"].validexp = /^(-?\d+)(\.\d+)?$/;//验证表达式 或 ^-?([1-9]\d*\.\d*|0\.\d*[1-9]\d*|0?\.0+|0)$
dtype["015"].errormsg = '必须为小数';

dtype["double"] = '016';//双精度浮点小数
dtype["016"] = {};
//dtype["016"].validexp = /^[-\+]?\d+(\.\d+)?$/;//验证表达式
dtype["016"].validexp = /^[0-9]+(\.[0-9]{2})?$/;//验证表达式0
dtype["016"].errormsg = '必须为小数';

dtype["floatOverZero"] = '017';//正浮点数 包括0
dtype["017"] = {};
dtype["017"].validexp = /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$/;
//dtype["017"].validexp = /^([1-9]*\d*[.]\d*)|^([0-9]+)$/;//验证表达式
dtype["017"].errormsg = '必须非负的整数或小数';

dtype["phone"] = '030';//电话号码
dtype["030"] = {};
dtype["030"].validexp = /^(\d{3,4}\-)?[1-9]\d{6,7}$/;
dtype["030"].errormsg = '必须为座机号码';

dtype["cellphone"] = '031';//手机
dtype["031"] = {};
dtype["031"].validexp = /^(\+\d{2,3}\-)?\d{11}$/;
dtype["031"].errormsg = '必须为手机号码';

dtype["phoneOrCellphone"] = '032';//手机或电话
dtype["032"] = {};
dtype["032"].validexp = /^(\d{3,4}\-)?[1-9]\d{6,7}$|^(\+\d{2,3}\-)?\d{11}$/;
dtype["032"].errormsg = '格式不正确';

dtype["netAddress"] = '040';//网址
dtype["040"] = {};
dtype["040"].validexp = /^http:\/\/[a-zA-Z0-9]+\.[a-zA-Z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/;
dtype["040"].errormsg = '必须为网址';

dtype["dateOnly"] = '051';//时间-精确到日
dtype["051"] = {};
dtype["051"].validexp = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/;
dtype["051"].errormsg = '必须为日期格式（yyyy-MM-dd）';

dtype["dateAndTime"] = '052';//时间-精确到秒
dtype["052"] = {};
dtype["052"].validexp = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/;
dtype["052"].errormsg = '必须为日期格式（yyyy-MM-dd HH:mm:ss）';

dtype["dateAndMinute"] = '053';//时间-精确到分钟
dtype["053"] = {};
dtype["053"].validexp = /^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2})$/;
dtype["053"].errormsg = '必须为日期格式（yyyy-MM-dd HH:mm）';

dtype["email"] = '060';//邮箱
dtype["060"] = {};
dtype["060"].validexp = /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/;
dtype["060"].errormsg = '必须为邮箱格式';

dtype["zipcode"] = '061';//邮政编码
dtype["061"] = {};
dtype["061"].validexp = /^\d{6}$/;
dtype["061"].errormsg = '必须为邮政编码格式';

dtype["ip"] = '070';//IP地址
dtype["070"] = {};
dtype["070"].validexp = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
dtype["070"].errormsg = '必须为ipv4地址格式';

dtype["idcard"] = '072';//身份证
dtype["072"] = {};
dtype["072"].validexp = /^\d{15}(\d{2}[A-Za-z0-9;])?$/;
dtype["072"].errormsg = '必须为身份证格式';


//-----------------------------------------分页相关-----------------------------------------------

//判断是否为正整数
function IsPInt(num) {
    if (num === undefined || num === null || num === '') {
        return false;
    }

    if (!isNaN(num)) { //判断是否为数字
        if (num.toString().indexOf(".") > -1) { //判断是否有小数点
            return false;
        }
        if (num.toString().indexOf("-") > -1) { //判断是否有负号
            return false;
        }
        return true;
    }
    else {
        return false;
    }
}

//客户端绑定列对象
function Dcol() {
    this.colname = '';
    this.classname = '';
    this.coltype = 'text';
}

//页码对象
function PagerObj(pgid, vpgsize, fn) {
    this.pagerid = pgid;
    this.pgsize = vpgsize;
    this.curr = 1;
    this.rows = 0;
    this.pgcount = 0;
    this.SetObj = function (ServerObj) {
        this.pgsize = ServerObj.PageSize;
        this.curr = ServerObj.PageIndex;
        this.pgcount = ServerObj.PageCount;
        this.rows = ServerObj.RecordCount;
        if (this.curr == 0) {
            this.curr = 1;
        }
        if (this.curr > this.pgcount && this.curr!=1) {
            this.curr = this.pgcount;
            fn();
        }
    }
    this.SetPagerText = function () {
        $('#' + pgid).find('.pager_curr').text(this.curr);
        $('#' + pgid).find('.txt_pager_curr').val(this.curr);
        $('#' + pgid).find('.pager_rowcount').text(this.rows);
        $('#' + pgid).find('.pager_totalpage').text(this.pgcount);
        $('#' + pgid).find('.pager_pgsize').text(this.pgsize);
    }
    this.Reset = function () {
        this.curr = 1;
        this.rows = 0;
        this.pgcount = 0;
    }
    var _self = this;
    $('#' + pgid).find('a.a_pager_pre').click(function () { ChangePage(_self, -1, fn); }); //绑定上一页
    $('#' + pgid).find('a.a_pager_next').click(function () { ChangePage(_self, -2, fn); }); //绑定下一页
    $('#' + pgid).find('a.a_pager_jump').click(function () {
        var jump_pg = $('#' + pgid).find('.txt_pager_curr').val();
        if (!IsPInt(jump_pg)) {
            $.MsgBox.Alert('fail', '请输入正整数作为跳转页码');
            return false;
        }

        ChangePage(_self, jump_pg, fn);
    });//绑定跳转事件
}
//翻页方法
function ChangePage(pg, flag, fn) {

    if (flag == '-1') { //向前翻页
        var nextindex = pg.curr - 1;

        if (!(nextindex > 0 && nextindex <= pg.pgcount)) {
            //$.MsgBox.Alert('error', '您输入的页码有误！');
            return;
        }

        if (nextindex > 0) {
            pg.curr = nextindex;
            fn();
        }
    }
    else if (flag == '-2') { //向后翻页
        var nextindex = pg.curr + 1;
        if (!(nextindex > 0 && nextindex <= pg.pgcount)) {
            //$.MsgBox.Alert('error', '您输入的页码有误！');
            return;
        }
        if (nextindex <= pg.pgcount) {
            pg.curr = nextindex;
            fn();
        }
    }
    else {//跳转
        if (IsPInt(flag)) {//首先保证数字
            var nextindex = parseInt(flag);
            if (!(nextindex > 0 && nextindex <= pg.pgcount)) {
                $.MsgBox.Alert('error', '您输入的页码有误！');
                return;
            }

            if (nextindex > 0 && nextindex <= pg.pgcount) {
                pg.curr = nextindex;
                fn();
            }
            else {
                $.MsgBox.Alert('fail', '输入页码超出最大范围');
            }
        }
        else {
            $.MsgBox.Alert('fail', '请输入正整数作为跳转页码');
        }
    }
}

//-----------------------------------------分页相关结束-------------------------------------------


//js生成guid方法
function newGuid(num) {
    var guid = "";
    for (var i = 1; i <= 32; i++) {
        var n = Math.floor(Math.random() * 16.0).toString(16);
        guid += n;
        if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
            guid += "-";
    }

    return guid;
}
//对话框关闭按钮事件
function fn_CloseDialog(obj) {
    $(obj).parents('div.dialogFrame').hide();
    $('.shadow').hide();
}

//提交数据项
//2017年2月27日 刘鑫 增加了DataItem赋值Val的语法糖的形式.
function DataItem(value) {
    this.Val = value != null ? value : '';//值
    this.DataType = '';//数据类型（从验证表达式获得，用于在服务器端验证时使用）
    this.CanBeNull = 1;//1-可为空；0-不可为空；
    this.CHS = '';//中文含义（从err自定义属性中获得，用于服务器端验证不通过时提示使用）
    this.ErrorMsg = '';//错误信息，用户客户端验证提示显示
    this.ValidHtml = '1';//是否验证html标记
    this.MaxLength = -1;
}

//验证数据项是否符合所属类型
function ValidDataItem(ditem) {
    if (ditem.CanBeNull == 0 && $.trim(ditem.Val) == '') {//如果不能为空，值为空，则报错“应该不能为空”，返回FALSE
        ditem.ErrorMsg = ditem.CHS + '不能为空';
        return false;
    }
    else if (ditem.CanBeNull == 1 && ditem.Val == '') {//如果能为空，并且值已经为空，则返回TRUE
        return true;
    }

    //长度限制验证
    if (ditem.MaxLength > 0 && ditem.MaxLength < ditem.Val.length) {
        ditem.ErrorMsg = ditem.CHS + '不能超过' + ditem.MaxLength + '字';
        return false;
    }
    //console.log(ditem.DataType+'  '+ditem.CHS);
    var reg = dtype[ditem.DataType].validexp;
    var errmsg = ditem.CHS + dtype[ditem.DataType].errormsg;
    ditem.ErrorMsg = errmsg;
    if (reg == '') {
        return true;
    }
    else {
        return reg.test(ditem.Val);
    }
}

//验证表单数据方法
function ValidForm(_box, _msgbox) {
    var throughValid = true;

    $(_box).find('[vld]').each(function () {
        var vitem = $(this).getVal();
        if (!ValidDataItem(vitem)) {
            throughValid = false;

            //界面上显示错误效果
            //alert(vitem.ErrorMsg);
            //$.MsgBox.Alert('fail', vitem.ErrorMsg);

            if (_msgbox != undefined && _msgbox != null && _msgbox != '1' && $.trim(_msgbox) != '') {
                if ($(_msgbox).length > 0) {
                    $(_msgbox).text(vitem.ErrorMsg);
                }
            }
            else if (_msgbox == '1') {
                $.MsgBox.Alert('fail', vitem.ErrorMsg);
            }
            else {
                if ($(this).nextAll('span.__errorInfo').length == 0) {
                    $(this).after('<span class="__errorInfo">' + vitem.ErrorMsg + '</span>');
                }
                else {
                    $(this).next('span.__errorInfo').text(vitem.ErrorMsg);
                }
            }
            return false;
        }
        else {
            if (_msgbox != undefined && _msgbox != null && _msgbox != '1' && $.trim(_msgbox) != '') {
                if ($(_msgbox).length > 0) {
                    $(_msgbox).text('');
                }
            }
            else if (_msgbox == '1') {

            }
            else {
                $(this).nextAll('span.__errorInfo').remove();
            }
        }
    });

    return throughValid;
}

//类似C#中的string.format
function StrFormat(format) {
    var strOutput = '';
    for (var i = 0; i < format.length - 1;) {
        if (format.charAt(i) == '{' && format.charAt(i + 1) != '{') {
            var index = 0, indexStart = i + 1;
            for (var j = indexStart; j <= format.length - 2; ++j) {
                var ch = format.charAt(j);
                if (ch < '0' || ch > '9') break;
            }
            if (j > indexStart) {
                if (format.charAt(j) == '}' && format.charAt(j + 1) != '}') {
                    for (var k = j - 1; k >= indexStart; k--) {
                        index += (format.charCodeAt(k) - 48) * Math.pow(10, j - 1 - k);
                    }
                    var swapArg = arguments[index + 1];
                    strOutput += swapArg;
                    i += j - indexStart + 2;
                    continue;
                }
            }
            strOutput += format.charAt(i);
            i++;
        }
        else {
            if ((format.charAt(i) == '{' && format.charAt(i + 1) == '{')
				|| (format.charAt(i) == '}' && format.charAt(i + 1) == '}')) {
                i++
            }
            strOutput += format.charAt(i);
            i++;
        }
    }
    strOutput += format.substr(i);
    return strOutput;
}

function UserLoginWhenOp(obj) {
    var fnSuccess = function (retobj) {
        if (retobj.flag == '1') {
            top.$.MsgBox.showHide('success', '登录成功！如果当前界面显示不正常请刷新当前页面');
            top.$('div.popup').remove();
        }
        else {
            top.$.MsgBox.Alert('fail', '登录失败！' + retobj.data);
        }
    }

    var userPwd = new DataItem();
    userPwd.Val = $(obj).parents('div.again-login').find('input[type=password].hotPwd').val();

    $.rajax('/Handler/login.ashx', 'loginHot', { 'pwd': userPwd }, fnSuccess, '4');
}

//更新树的折叠展开状态
function _f_switch_tree_open_close(obj) {
    var v_parentTr = $(obj).parents('tr');
    var v_table = $(obj).parents('table');
    if (v_parentTr.hasClass('_tree_opened')) {
        var v_level = parseInt(v_parentTr.attr('lv'));
        var v_allChild = v_table.find("tr[parentStr*='" + v_parentTr.attr('cid') + "']");
        if (v_allChild.length > 0) {
            v_allChild.hide();
            v_allChild.find('a.__flodLink').parents('tr').removeClass('_tree_opened').addClass('_tree_closed');
            v_allChild.find('a.__flodLink').find('img:first').prop('src', '/img/arrowblue2.png');
            v_allChild.find('a.__flodLink').parents('tr').removeClass('_tree_opened').addClass('_tree_closed');
        }
        $(obj).find('img:first').prop('src', '/img/arrowblue2.png');
        v_parentTr.removeClass('_tree_opened').addClass('_tree_closed');
    }
    else {
        var v_tbody = $(obj).parents('table');
        var v_straightChildren = v_tbody.find('tr[fatherid=' + v_parentTr.attr('cid') + ']');
        if (v_straightChildren.length > 0) {
            //v_straightChildren.find('a.__flodLink img').prop('src', '/img/arrowblue2.png');
            v_straightChildren.show();
        }
        $(obj).find('img:first').prop('src', '/img/arrowblue.png');
        v_parentTr.removeClass('_tree_closed').addClass('_tree_opened');
    }
}
//改变树种的checkbox状态时候触发的事件
function _f_switch_checkbox_state(obj) {
    var v_parentTr = $(obj).parents('tr');
    var v_table = $(obj).parents('table');

    if ($(obj).is(':checked')) {
        var tbAttributes = v_table.data('Attributes');
        var vRootValue = tbAttributes.RootValue;
        var vCurrCid = v_parentTr.attr('cid');
        var vFatherId = v_parentTr.attr('fatherid');
        var vParentShouldUnChecked = true;
        while (vFatherId != vRootValue) {

            //查找父节点
            var temp_trs = v_table.find('tr[cid=' + vFatherId + ']')

            //如果父节点未选中，则改变为选中状态
            if (!temp_trs.find('input[type=checkbox].__tree_checkbox').is(':checked')) {
                temp_trs.find('input[type=checkbox].__tree_checkbox').prop('checked', 'checked');
            }
            vFatherId = temp_trs.attr('fatherid');
        }

        var v_allChild = v_table.find("tr[parentStr*='" + v_parentTr.attr('cid') + "']");
        if (v_allChild.length > 0) {
            v_allChild.find('input[type=checkbox].__tree_checkbox').prop('checked', 'checked');
        }
    }
    else {
        var tbAttributes = v_table.data('Attributes');
        var vRootValue = tbAttributes.RootValue;
        var vCurrCid = v_parentTr.attr('cid');
        var vFatherId = v_parentTr.attr('fatherid');
        var vParentShouldUnChecked = true;
        while (vFatherId != vRootValue && vParentShouldUnChecked) {

            //找所有同级节点
            var temp_trs = v_table.find('tr[fatherid=' + vFatherId + ']')

            //循环所有同级节点
            temp_trs.each(function (i) {
                //同级节点中如果有选中的
                if ($(this).find('input[type=checkbox].__tree_checkbox').is(':checked')) {
                    //则父节点不应该取消勾选
                    vParentShouldUnChecked = false;
                }
            });

            //如果父节点应该取消勾选
            if (vParentShouldUnChecked) {
                //父节点取消勾选
                v_table.find('tr[cid=' + vFatherId + ']').find('input[type=checkbox].__tree_checkbox').removeProp('checked');
                //取父节点的父节点
                vFatherId = v_table.find('tr[cid=' + vFatherId + ']').attr('fatherid');
            }
            else {
                break;
            }

        }

        //当前节点的所有子节点取消选中
        var v_allChild = v_table.find("tr[parentStr*='" + v_parentTr.attr('cid') + "']");
        if (v_allChild.length > 0) {
            v_allChild.find('input[type=checkbox].__tree_checkbox').removeProp('checked');
        }
    }
}

var __ajax__count = '';
//jquery.fn封装

$.extend({
    rajax: function (_url, _reqflag, _data, _successFn, _opflag) {

        var _mid = $('form:first').attr('mid');
        var _fid = $('form:first').attr('fid');
        var _opt = _opflag;
        if (_mid == '' || _mid == undefined || _fid == '' || _fid == undefined || _opt == '' || _opt == undefined) {
            //alert('参数错误');
            $.MsgBox.Alert('fail', '参数错误');
            return false;
        }

        var _rqdata = { 'req_type': _reqflag, '_ui_data': (_data != {} && _data != null && _data != '' ? JSON.stringify(_data) : '') };

        _rqdata["mid"] = _mid;
        _rqdata["fid"] = _fid;
        _rqdata["opt"] = _opt;

        var _ajaxItems = {
            url: _url
            , data: _rqdata
            , type: 'POST'
            , cache: false
            , dataType: 'json'
            , success: function (retobj) {
                handleAjaxFlag(true);

                //var retobj = $.parseJSON(msg);
                if (retobj.flag == '-1') {
                    $.MsgBox.Alert('fail', retobj.data);
                    return false;
                }
                else if (retobj.flag == '-9') {
                    $.MsgBox.Alert('fail', retobj.data);
                    return false;
                }
                else if (retobj.flag == '-8') {//用户Session丢失，统一调用登录弹出
                    if (top.$('div.popup:visible').length == 0) {
                        var v_htm_login = '<div class="popup" style="z-index:99999;">'
                                            + '<div class="popup-op"></div>'
                                            + '<div class="again-login popup-main">'
                                                + '<p>登录超时，请输入密码重新登录：</p>'
                                                + '<input class="hotPwd" type="password"/>'
                                                + '<div>'
                                                    + '<input type="button" class="btn" value="登录" onclick="UserLoginWhenOp(this)" />或'
                                                    + '<a class="other-login" onclick="top.window.location.reload();">用其他账号登陆</a>'
                                                + '</div>'
                                            + '</div>'
                                        + '</div>';
                        top.$('form:first').append(v_htm_login);
                        top.$('div.popup').show();
                    }
                    return false;
                }
                else if (retobj.flag == '-7') {//用户缓存过期
                    top.window.location.reload();
                }

                //成功后的处理（自定义函数）
                return _successFn(retobj);
            }
            , error: function (e1, e2, e3) {

                handleAjaxFlag(true);

                if (e1.readyState != '0') {
                    $.MsgBox.Alert('fail', '请求异常');
                }

                //if (__ajax__count.length == 0) {
                //    $.MsgBox.Alert('fail', '请求异常');
                //}
                //alert('请求异常');
            }
        };

        handleAjaxFlag(false);
        $.ajax(_ajaxItems);
    }
    ,
    removeEmptyProperty: function (jsonObj) {
        var delArr = [];
        for (var p in jsonObj) { // 方法
            if (jsonObj[p] == '') {
                delArr.push(p.toString());
            }
        } // 最后显示所有的属性

        for (var i = 0; i < delArr.length; i++) {
            delete jsonObj[delArr[i]];
        }

        return jsonObj;
    }
    ,
    getBubbleHtml: function (_ophtml) {
        var resHtml = '<div class="bubblecontainer" >'
                            + '<img onmouseover="OpOver(this)" class="bubble_img bn" src="/img/wheel_blue2.png" />'
                            + '<div class="bubblebox bn">'
                                + '<em></em>'
                                + '<span></span>'
                                + _ophtml
                                + '<div class="clearFix"></div>'
                            + '</div>'
                            + '<div class="clearFix"></div>'
                        + '</div>';
        return resHtml;
    }
    ,
    isNullOrUndefinedOrEmpty: function (_value) {
        if (_value == undefined || _value == null || _value == '') {
            return true;
        }
        else {
            return false;
        }
    }
});

function handleAjaxFlag(IsReturn) {
    if (IsReturn) {
        __ajax__count = __ajax__count.substr(1);
        if (__ajax__count.length == 0) {
            $('div.shadow:visible').hide();
        }
    }
    else {
        __ajax__count += '1';
        if ($('div.shadow:visible').length == 0) {
            $('div.shadow').html('<img src="/img/Loading.gif" style="width:25px;height:25px;vertical-align:middle;" />&nbsp;&nbsp;' + '正在处理数据，请稍后...').css('line-height', $(window).height() + 'px').show();
        }
    }
}

$.fn.extend({
    setChildTable: function (childColumnName, childTableFormatData) {
        var _self = $(this);
        if (childColumnName == null || childColumnName == undefined || childColumnName == '') {
            throw '请设置包含明细数据的列名';
            return false;
        }
        _self.data("ChildCol", childColumnName);

        if (childTableFormatData != undefined && childTableFormatData != null && $.isArray(childTableFormatData) && childTableFormatData.length > 0) {
            _self.data("ChildFormat", childTableFormatData);

        }
        else {
            throw '设置明细数据显示格式不正确';
        }
    }
    ,
    databind: function (clientTable) {
        //tableid = $(this).prop('id');

        var _self = $(this);
        var _hasChildTable = typeof _self.data("ChildCol") == 'string' && _self.data("ChildCol") != '' ? true : false;
        var _ChildCol = _hasChildTable ? _self.data("ChildCol") : '';
        _self.find('tbody > tr').remove();

        if (!$.isArray(clientTable)) {
            return false;
        }

        if (_hasChildTable) {
            _self.find('thead').find('th:first').before('<th></th>');
        }

        var arrCols = [];
        //取得行头遍历绑定的列名
        _self.find('thead > tr:first').find('th').each(function () {
            if ($(this).attr('datacol') != undefined && $.trim($(this).attr('datacol')) != '') {
                var tmp = new Dcol();
                tmp.colname = $.trim($(this).attr('datacol'));
                tmp.titlename = $.trim($(this).attr('titlecol'));
                tmp.classname = ($(this).attr('cls') != undefined && $.trim($(this).attr('cls')) != '') ? $.trim($(this).attr('cls')) : '';
                tmp.coltype = ($(this).attr('coltype') == undefined || $(this).attr('coltype') == '') ? 'text' : $(this).attr('coltype');
                tmp.maxlen = ($(this).attr('maxlen') == undefined || $(this).attr('maxlen') == '' || /^[0-9]*[1-9][0-9]*$/.test($(this).attr('maxlen')) == false) ? 15 : parseInt($(this).attr('maxlen'));
                tmp.notcut = $(this).attr('notcut') == '1' ? true : false;
                arrCols.push(tmp);
            }
        });
        var vhtml = '';
        if (clientTable != null && clientTable.length > 0) {
            vhtml = '';
            for (var i = 0; i < clientTable.length; i++) {
                var rowClass = (i % 2 == 0) ? 'even' : 'odd';
                vhtml += '<tr class="' + rowClass + '">';

                var row = clientTable[i];

                var v_isClildTableHasData = false;
                var childNo = newGuid(0);
                if (_hasChildTable) {
                    var v_tdOpenFlagHtml = $.isArray(clientTable[i][_ChildCol]) && clientTable[i][_ChildCol].length > 0 ? '<a href="javascript:void(0)" controlno="' + childNo + '" onclick="_f_switch_state(this)"><img src="/img/arrowblue2.png" /></a>' : '';
                    vhtml += '<td>' + v_tdOpenFlagHtml + '</td>';
                    v_isClildTableHasData = $.isArray(clientTable[i][_ChildCol]) && clientTable[i][_ChildCol].length > 0;
                }

                for (var j = 0; j < arrCols.length; j++) {
                    var vClassNameExp = arrCols[j].classname != '' ? arrCols[j].classname : '';
                    var vColTypeExp = '';
                    if (arrCols[j].coltype == 'chk') {
                        vColTypeExp = '<input type="checkbox" value="' + row[arrCols[j].colname] + '" />';
                    }
                    if (IsPInt(arrCols[j].colname.substr(0, 1))) { //如果开头是数字，说明是操作列
                        var v_p0 = arrCols[j].colname.substr(0, 1);
                        var v_p1 = arrCols[j].colname.substr(1, 1);
                        var v_p2 = arrCols[j].colname.substr(2, 1);
                        var vLinkExp = '';
                        if (v_p0 == '1') {
                            vLinkExp += '<a href="javascript:void(0)" onclick="Edit(this)">编辑</a>&nbsp;&nbsp;';
                        }
                        if (v_p1 == '1') {
                            vLinkExp += '<a href="javascript:void(0)" onclick="Delete(this)">删除</a>&nbsp;&nbsp;';
                        }
                        if (v_p2 == '1') {
                            //vLinkExp += '<a href="javascript:void(0)" onclick="' + fnObj.fnName + '(this)">' + fnObj.disName + '</a>'
                        }
                        vhtml += '<td class="' + vClassNameExp + '">' + vLinkExp + '</td>';
                    }
                    else if (arrCols[j].coltype == 'chk') {
                        vhtml += '<td class="' + vClassNameExp + '">' + vColTypeExp + '</td>';
                    }
                    else {
                        /*if (arrCols[j].classname.indexOf('showtitle') > 1) {
                            
                        } else {
                            vhtml += '<td class="' + vClassNameExp + '">' + row[arrCols[j].colname] + '</td>';
                        }*/

                        if (row[arrCols[j].colname] === null) {
                            row[arrCols[j].colname] = '';
                        }

                        if (row[arrCols[j].titlename] != "" && row[arrCols[j].titlename] != undefined && row[arrCols[j].titlename] != null) {
                            if (row[arrCols[j].colname] === undefined) {
                                vhtml += '<td class="' + vClassNameExp + '">绑定错误</td>';
                            }
                            else {
                                //vhtml += '<td class="' + vClassNameExp + '" title="' + row[arrCols[j].titlename] + '">' + (row[arrCols[j].colname].length > arrCols[j].maxlen ? row[arrCols[j].colname].substr(0, arrCols[j].maxlen) + '...' : row[arrCols[j].colname]) + '</td>';
                                vhtml += '<td class="' + vClassNameExp + '" title="' + row[arrCols[j].titlename] + '">' + (!arrCols[j].notcut && row[arrCols[j].colname].length > arrCols[j].maxlen && vClassNameExp != 'noshow' ? row[arrCols[j].colname].substr(0, arrCols[j].maxlen) + '...' : row[arrCols[j].colname]) + '</td>';
                            }
                        } else {
                            if (row[arrCols[j].colname] === undefined) {
                                vhtml += '<td class="' + vClassNameExp + '">绑定错误</td>';
                            }
                            else {
                                if (!v_isClildTableHasData) {
                                    vhtml += '<td class="' + vClassNameExp + '" title="' + (!arrCols[j].notcut ? row[arrCols[j].colname] : '') + '">' + (!arrCols[j].notcut && row[arrCols[j].colname].length > arrCols[j].maxlen && vClassNameExp != 'noshow' ? row[arrCols[j].colname].substr(0, arrCols[j].maxlen) + '...' : row[arrCols[j].colname]) + '</td>';
                                }
                                else {
                                    vhtml += '<td class="' + vClassNameExp + '">' + row[arrCols[j].colname] + '</td>';
                                }
                            }
                        }
                    }
                }
                vhtml += '</tr>';
                if (v_isClildTableHasData) {
                    var v_childTableData = clientTable[i][_ChildCol];
                    var v_childTableFormatData = _self.data('ChildFormat');
                    var v_tableTemplete = '<table class="tab"><thead><tr>';
                    //生成表头
                    for (var m = 0; m < v_childTableFormatData.length; m++) {
                        var ro = v_childTableFormatData[m];
                        v_tableTemplete += '<th>' + ro.name + '</th>'
                    }
                    v_tableTemplete += '</tr></thead><tbody>';
                    //生成数据
                    for (var m = 0; m < v_childTableData.length; m++) {
                        var ro = v_childTableData[m];
                        var v_class = (m % 2 == 0) ? 'even' : 'odd';
                        v_tableTemplete += '<tr class="' + v_class + '">';
                        for (var n = 0; n < v_childTableFormatData.length; n++) {
                            var pName = v_childTableFormatData[n].col;
                            v_tableTemplete += '<td>' + ro[pName] + '</td>';
                        }
                        v_tableTemplete += '</tr>';
                    }

                    v_tableTemplete += '</tbody></table>';

                    vhtml += '<tr id="child_' + childNo + '" class="childtr"><td></td><td colspan="' + arrCols.length + '">' + v_tableTemplete + '</td></tr>';
                }
            }
        }
        else if (clientTable == null || clientTable == undefined || clientTable.length == 0) {
            var v_colspan = _self.find('thead > tr:first > th').length;
            vhtml = '<tr><td colspan="' + v_colspan + '" style="text-align:center; vertical-align:middle; background-color:#f8f8f8;">' + noDataShow('暂无数据') + '</td></tr>'
        }

        _self.find('tbody').html(vhtml);
    }
    ,
    bindTreeTable: function (clientTable, idCol, parentCol, rootValue, isOpened, sortCol, widthCheckbox, checkedCol, forCheck) {
        var _self = $(this);
        _self.data('flag', 'tree');
        _self.data('dataSource', clientTable);
        var _attributes = {
            IdCol: idCol
            , ParentCol: parentCol
            , RootValue: rootValue
            , IsOpened: isOpened
            , SortCol: sortCol
            , WidthCheckbox: widthCheckbox
        }
        _self.data('Attributes', _attributes);

        var _v_hasCheckbox = widthCheckbox === true ? true : false;
        var _v_readOnly = forCheck === true ? true : false;

        if (widthCheckbox === true) {
            _self.data('hasCheckbox', '1');
        }
        else {
            _self.data('hasCheckbox', '0');
        }

        _self.find('tbody > tr').remove();

        if (!$.isArray(clientTable)) {
            return false;
        }

        var arrCols = [];
        //取得行头遍历绑定的列名
        _self.find('thead > tr:first').find('th').each(function () {
            if ($(this).attr('datacol') != undefined && $.trim($(this).attr('datacol')) != '') {
                var tmp = new Dcol();
                tmp.colname = $.trim($(this).attr('datacol'));
                tmp.titlename = $.trim($(this).attr('titlecol'));
                tmp.classname = ($(this).attr('cls') != undefined && $.trim($(this).attr('cls')) != '') ? $.trim($(this).attr('cls')) : '';
                tmp.coltype = ($(this).attr('coltype') == undefined || $(this).attr('coltype') == '') ? 'text' : $(this).attr('coltype');

                arrCols.push(tmp);
            }
        });

        //定义要层层循环的遍历的数组
        var LayerDataArr = [];
        var Layer1DataArr = null;
        Layer1DataArr = clientTable.findMutliByValue(parentCol, rootValue);
        var vhtml = '';
        if ($.isArray(Layer1DataArr) && Layer1DataArr.length > 0) {
            LayerDataArr.push(Layer1DataArr);

            var vParentNodes = Layer1DataArr;
            while ($.isArray(vParentNodes) && vParentNodes.length > 0) {
                var vNextLayerNodes = clientTable.findMutliByValueArr(parentCol, vParentNodes, idCol);
                if ($.isArray(vNextLayerNodes) && vNextLayerNodes.length > 0) {
                    LayerDataArr.push(vNextLayerNodes);
                }
                vParentNodes = vNextLayerNodes;
            }
        }

        var foldImgUrl = isOpened ? '/img/arrowblue.png' : '/img/arrowblue2.png';

        for (var i = 0; i < LayerDataArr.length; i++) {
            var layerData = LayerDataArr[i];
            for (var k = 0; k < layerData.length; k++) {
                var item = layerData[k];
                if (i == 0) {
                    item.ParentStr = '';
                }
                else {
                    var vParentItem = LayerDataArr[i - 1].getItemByValue(idCol, item[parentCol]);
                    if (vParentItem != null) {
                        item.ParentStr = vParentItem.ParentStr + ',\'' + vParentItem[idCol] + '\'';
                    }
                }
            }
        }

        if (LayerDataArr.length > 0) {
            var nLayer = 0;

            for (var i = 0; i < LayerDataArr.length; i++) {
                var layerData = LayerDataArr[i];
                var nextLv = i < LayerDataArr.length - 1 ? LayerDataArr[i + 1] : null;
                if (i == 0) {
                    layerData = layerData.sort(function (a, b) {
                        return a[sortCol] > b[sortCol];
                    });
                }
                else {
                    layerData = layerData.sort(function (a, b) {
                        return a[sortCol] < b[sortCol];
                    });
                }

                var v_tmpHtml = '';
                for (var k = 0; k < layerData.length; k++) {
                    v_tmpHtml = '';
                    var row = layerData[k];
                    var myChild = [];
                    if (nextLv != null) {
                        myChild = nextLv.findMutliByValue(parentCol, row[idCol]);
                    }

                    var openedClssExp = myChild.length > 0 ? (isOpened ? '_tree_opened' : '_tree_closed') : '';
                    if (i > 0 && !isOpened) {
                        openedClssExp += ' noshow';
                    }

                    v_tmpHtml += '<tr lv="' + i + '" cid="' + row[idCol] + '" fatherid="' + row[parentCol] + '" childcount="' + myChild.length + '" class="' + openedClssExp + '" parentStr="' + row.ParentStr + '">';
                    for (var j = 0; j < arrCols.length; j++) {
                        var vClassNameExp = arrCols[j].classname != '' ? arrCols[j].classname : '';
                        var OpFoldExp = myChild.length > 0 && j == 0 ? '<a href="javascript:void(0)" class="__flodLink" onclick="_f_switch_tree_open_close(this)">&nbsp;<img src="' + foldImgUrl + '" />&nbsp;</a>' : '';
                        var vFirstTdPaddingLeftExp = j == 0 ? 'style="padding-left:' + ((i * 20) + (i == 0 ? 0 : i * 10) + (myChild.length == 0 ? 17.3 : 0)) + 'px;"' : '';

                        var vCheckedExp = typeof checkedCol === 'string' ? (row[checkedCol] === '1' ? 'checked="checked"' : '') : '';
                        var vReadOnlyExp = _v_readOnly ? 'disabled="disabled"' : '';
                        var vCheckboxExp = _v_hasCheckbox && j == 0 ? '<input type="checkbox" onchange="_f_switch_checkbox_state(this)" value="' + row[idCol] + '" class="__tree_checkbox" ' + vCheckedExp + ' ' + vReadOnlyExp + ' />' : '';

                        if (arrCols[j].classname.indexOf('showtitle') > 1) {
                            if (row[arrCols[j].titlename] != "" && row[arrCols[j].titlename] != undefined && row[arrCols[j].titlename] != null) {
                                v_tmpHtml += '<td class="' + vClassNameExp + '" title="' + row[arrCols[j].titlename] + '" ' + vFirstTdPaddingLeftExp + '>' + OpFoldExp + vCheckboxExp + row[arrCols[j].colname] + '</td>';
                            } else {
                                v_tmpHtml += '<td class="' + vClassNameExp + '" title="' + row[arrCols[j].colname] + '" ' + vFirstTdPaddingLeftExp + '>' + OpFoldExp + vCheckboxExp + row[arrCols[j].colname] + '</td>';
                            }
                        } else {
                            v_tmpHtml += '<td class="' + vClassNameExp + '" ' + vFirstTdPaddingLeftExp + '>' + OpFoldExp + vCheckboxExp + row[arrCols[j].colname] + '</td>';
                        }
                    }
                    v_tmpHtml += '</tr>';
                    v_tmpHtml += 'pid_' + row[idCol];

                    if (i > 0) {
                        var v_ParentId = row[parentCol];
                        var v_ToReplace = 'pid_' + v_ParentId;
                        vhtml = vhtml.replace(v_ToReplace, v_ToReplace + v_tmpHtml);
                    }
                    else {
                        vhtml += v_tmpHtml;
                    }
                }
            }

            while (vhtml.indexOf('pid_') > -1) {
                var v_toReplace = vhtml.substr(vhtml.indexOf('pid_'), 40);
                vhtml = vhtml.replace(v_toReplace, '');
            }
        }
        else {
            var v_colspan = _self.find('thead > tr:first > th').length;
            vhtml = '<tr><td colspan="' + v_colspan + '" style="text-align:center; vertical-align:middle; background-color:#f8f8f8;">' + noDataShow('暂无数据') + '</td></tr>'
        }

        _self.find('tbody').html(vhtml);
    }
    ,
    //获得选中的树的checkbox的jquery包装集
    getTreeChecked: function () {
        var _self = $(this);
        if (!_self.is('table')) {
            throw 'getTreeChecked 的调用对象不是table';
            return false;
        }

        if (!_self.data('flag') === 'tree') {
            throw 'getTreeChecked 的调用对象不是树table';
            return false;
        }

        if (_self.data('hasCheckbox') != '1') {
            throw 'getTreeChecked 的调用对象不是含有checkbox的树';
            return false;
        }

        var _checkedBoxes = _self.find('tbody').find('input[type=checkbox]:checked');

        return _checkedBoxes;
    }
    ,
    //获得选中的checkbox的值的数组
    getTreeCheckedValues: function () {
        var _self = $(this);
        if (!_self.is('table')) {
            throw 'getTreeCheckedValues 的调用对象不是table';
            return false;
        }

        if (!_self.data('flag') === 'tree') {
            throw 'getTreeCheckedValues 的调用对象不是树table';
            return false;
        }

        if (_self.data('hasCheckbox') != '1') {
            throw 'getTreeCheckedValues 的调用对象不是含有checkbox的树';
            return false;
        }

        var _checkedBoxes = _self.find('tbody').find('input[type=checkbox]:checked');
        var _arrReturn = [];
        _checkedBoxes.each(function () {
            _arrReturn.push($(this).val());
        });
        return _arrReturn;
    }
    ,
    //获得选中的checkbox的对应数据源中的行的指定列值
    getTreeCheckedValueOfCol: function (ColName) {
        var _self = $(this);
        if (!_self.is('table')) {
            throw 'getTreeCheckedValueOfCol 的调用对象不是table';
            return false;
        }

        if (!_self.data('flag') === 'tree') {
            throw 'getTreeCheckedValueOfCol 的调用对象不是树table';
            return false;
        }

        if (_self.data('hasCheckbox') != '1') {
            throw 'getTreeCheckedValueOfCol 的调用对象不是含有checkbox的树';
            return false;
        }

        var _checkedBoxes = _self.find('tbody').find('input[type=checkbox]:checked');
        var _arrReturn = [];
        var _dataTable = _self.data('dataSource');
        _checkedBoxes.each(function () {
            var targetItem = _dataTable.getItemByValue(_self.Attribute.IdCol, $(this).val());
            var targetValue = targetItem[ColName];
            _arrReturn.push(targetValue);
        });
        return _arrReturn;
    }
    ,
    initSortFn: function (fnDataBind) {
        var tableid = $(this).prop('id');
        $('#' + tableid + ' > thead > tr:first').find('th').each(function () {
            if ($(this).attr('datacol') != undefined && $.trim($(this).attr('datacol')) != '') {

                var _sortcode = ($(this).attr('sortcode') != undefined && $.trim($(this).attr('sortcode')) != '' ? $.trim($(this).attr('sortcode')) : '');
                if (_sortcode != '') {
                    if ($(this).find('.sortArrow').length == 0) {
                        $(this).append('&nbsp;<span class="sortArrow"></span>');
                    }
                    $(this).unbind().click(function () {
                        //页面效果
                        if (!$(this).find('.sortArrow').hasClass('downArrow') && !$(this).find('.sortArrow').hasClass('upArrow')) {
                            $(this).parents('table').find('.sortArrow').removeClass('upArrow').removeClass('downArrow');
                            $(this).find('.sortArrow').addClass('upArrow');
                        }
                        else {
                            if ($(this).find('.sortArrow').hasClass('downArrow')) {
                                $(this).find('.sortArrow').removeClass('downArrow').addClass('upArrow');
                            }
                            else {
                                $(this).find('.sortArrow').removeClass('upArrow').addClass('downArrow');
                            }
                        }

                        //调用查询数据方法
                        if (fnDataBind && typeof (fnDataBind) == 'function') {
                            fnDataBind();
                        }
                    });
                }
            }
        });
    }
    ,
    getSortDataItem: function () {
        var tableid = $(this).prop('id');

        var v_span = $('#' + tableid + ' > thead th').find('.upArrow,.downArrow').first();
        var v_th = v_span.parent();

        var IsDesc = '0';

        if (v_span.hasClass('downArrow')) {
            IsDesc = '1'
        }

        var sortColName = v_th.attr('sortcode');

        if (sortColName == undefined || sortColName == '') {
            return null;
        }

        return new DataItem(IsDesc + sortColName);
    }
    ,
    showDialog: function (dia_title, dia_width, dia_height, isShowClose) {
        if (!$(this).hasClass('dialog')) {
            return false;
        }

        if ($('.shadow').length == 0) {
            $('form:first').append('<div class="shadow"></div>');
            $('.shadow').width(window.screen.availWidth).height(window.screen.availHeight);
        }
        var _dialogID = '';
        if ($(this).parents('div.dialogFrame').length == 0) {
            var _dialogID = 'dialog_' + newGuid(Math.random());

            var _dialogContent = '<div class="dialogContent" style=" width:' + dia_width + 'px; height:' + dia_height + 'px;"></div>';
            var _dialogHtml = '<div id="' + _dialogID + '" class="dialogFrame"><div class="dialogTitle"><span unselectable="on" style="-webkit-user-select: none;-moz-user-select: none;">' + dia_title + '</span><img class="closeDialog" src="/Images/closeDialog1.png" onclick="fn_CloseDialog(this)" /></div><div class="clear"></div>' + _dialogContent + '</div>';
            $('form:first').append(_dialogHtml);
            $(this).appendTo($('#' + _dialogID).find('div.dialogContent'));

            var _dialogObj = $('#' + _dialogID);

            $('#' + _dialogID).find('div.dialogTitle').mousedown(function (e) {

                var MouseWinX = e.clientX;
                var MouseWinY = e.clientY;

                var DiaWinX = _dialogObj.position().left - $(document).scrollLeft();
                var DiaWinY = _dialogObj.position().top;

                var MouseDiaX = MouseWinX - DiaWinX;
                var MouseDiaY = MouseWinY - DiaWinY;

                _dialogObj.mousemove(function (e) {

                    var DiaLeft = e.clientX - MouseDiaX;
                    var DiaTop = e.clientY - MouseDiaY;

                    DiaLeft = DiaLeft <= 0 ? 0 : (DiaLeft >= ($(window).width() - dia_width) ? ($(window).width() - dia_width) : DiaLeft);
                    DiaTop = DiaTop <= 0 ? 0 : (DiaTop >= ($(window).height() - dia_height - 35) ? ($(window).height() - dia_height - 35) : DiaTop);

                    _dialogObj.css({ 'left': DiaLeft + 'px', 'top': DiaTop + 'px' });
                });

            }).mouseup(function () {
                _dialogObj.unbind('mousemove');
            }).mouseout(function () {
                _dialogObj.unbind('mousemove');
            });
        }
        else {
            _dialogID = $(this).parents('div.dialogFrame').attr('id');
        }

        var centerPosition = ($(window).width() - dia_width) / 2;
        var middlePosition = ($(window).height() - dia_height - 35) / 2;
        $('#' + _dialogID).css({ 'left': centerPosition + 'px', 'top': middlePosition + 'px' });
        if (!isShowClose) {
            $('#' + _dialogID).find('.closeDialog').hide();
        }
        else {
            $('#' + _dialogID).find('.closeDialog').show();
        }
        $('.shadow').show();
        $(this).show();
        $('#' + _dialogID).show();
    }
    ,
    showDialogCloseButton: function (isShowClose) {
        if (!$(this).hasClass('dialog')) {
            return false;
        }
        _dialogID = $(this).parents('div.dialogFrame').attr('id');
        if (!isShowClose) {
            $('#' + _dialogID).find('.closeDialog').hide();
        }
        else {
            $('#' + _dialogID).find('.closeDialog').show();
        }
    }
    ,
    closeDialog: function () {
        $(this).parents('div.dialogFrame').hide();
        $('.shadow').hide();
    }
    ,
    getVal: function () {
        var _self = $(this);
        var tmpItem = new DataItem();
        if ($(this).find('input[type=radio]').length > 0) {
            if (_self.find('input[type=radio]:checked').length > 0) {
                tmpItem.Val = $(this).find('input[type=radio]:checked').val();
            }
            else {
                tmpItem.Val = '';
            }
        }
        else if ($(this).is('label')) {
            tmpItem.Val = $(this).attr('value');
        }
        else if ($(this).is('span')) {
            tmpItem.Val = $(this).text();
        }
        else {
            tmpItem.Val = $(this).val();
        }
        if (_self.prop('maxlength') != undefined && _self.prop('maxlength') != null && _self.prop('maxlength') != '') {
            tmpItem.MaxLength = parseInt(_self.prop('maxlength'));
        }
        tmpItem.CHS = $(this).attr('err');
        var vtype = $(this).attr('vld');
        if (vtype != undefined && vtype != '') {
            if (vtype.length == 1) {
                tmpItem.DataType = dtype['normal'];
                tmpItem.CanBeNull = vtype;
            }
            else {
                tmpItem.DataType = dtype[vtype.substr(0, vtype.length - 1)];
                tmpItem.CanBeNull = vtype.substr(vtype.length - 1);
            }
        }
        return tmpItem;
    }
    ,
    getText: function () {
        var tmpItem = new DataItem();
        tmpItem.Val = $(this).text();
        tmpItem.CHS = $(this).attr('err');
        var vtype = $(this).attr('vld');
        if (vtype != undefined && vtype != '') {
            if (vtype.length == 1) {
                tmpItem.DataType = dtype['normal'];
                tmpItem.CanBeNull = vtype;
            }
            else {
                tmpItem.DataType = dtype[vtype.substr(0, vtype.length - 1)];
                tmpItem.CanBeNull = vtype.substr(vtype.length - 1);
            }
        }
        return tmpItem;
    }
    ,
    getPostData: function () {
        var __v_data = {};
        $(this).find('[iname]').each(function () {
            if ($(this).attr('iname') != undefined) {
                __v_data[$(this).attr('iname')] = $(this).getVal();
            }
        });

        return __v_data;
    }
    ,
    bindInameValue: function (_data, callback) {
        var _self = $(this);
        _self.find('[iname]').each(function () {
            var v_iname = $(this).attr('iname');
            if (_data[v_iname] != undefined && _data[v_iname] != null) {
                if ($(this).is('select') || $(this).is('input[type=text]') || $(this).is('input[type=password]') || $(this).is('input[type=hidden]') || $(this).is('textarea')) {

                    if ($(this).hasClass('input-date')) {
                        _data[v_iname] = _data[v_iname].substr(0, 10);
                    }

                    $(this).val(_data[v_iname]);
                }
                else {
                    $(this).text(_data[v_iname]);
                }
            }
        });

        if (typeof (callback) == 'function') {
            callback();
        }
    }
    ,
    setEvenTrBg: function (colorCode) {
        $(this).find('tr:even > td').css('background-color', colorCode);
    }
    ,
    showBubbleWindow: function (obj, closeBtnId) {
        var _self = $(this);
        var v_top = $(obj).offset().top;
        var bodyH = $(window).height();
        var aH = $('body').height();
        var v_left = $(obj).offset().left + ($(obj).width() + parseInt($(obj).css('padding-left').replace('px', '')) + parseInt($(obj).css('padding-right').replace('px', ''))) / 2 - $(this).width() * 0.45 - 6;
        var h = $(this).outerHeight(true) + $(obj).offset().top;
        var eH = $(this).outerHeight(true);
        var hT = $(obj).offset().top - $(this).outerHeight(true) - 10;
        var t = $(obj).offset().top;
        v_top += $(obj).height();
        $(this).css({ 'top': v_top + 'px', 'left': v_left + 'px' });


        //绑定关闭事件
        if (closeBtnId != null && closeBtnId != undefined && closeBtnId != '') {
            $('#' + closeBtnId).unbind('click').click(function () {
                _self.hide();
            });
        }

        if (window.frames.length != parent.frames.length) {
            bodyH = window.frames.document.documentElement.clientHeight;
        }
        var bH = t % bodyH + eH + 10;

        var e = $(this);

        if (h > aH) {
            if (eH > t) {
                setTopCss();
            } else {
                setButtonCss();
            }

        } else {
            if (bH > bodyH) {
                if (eH > t) {
                    setTopCss();
                } else {
                    setButtonCss();
                }

            } else {
                setTopCss()
            }
        }


        function setButtonCss() {
            e.css({ 'top': hT + 'px' });

            e.find('.traggle-top').parents('div:first').addClass('bott');
            e.find('.traggle-top').removeClass('traggle-top').addClass('trgg-bottom');
            e.find('.traggle-white').removeClass('traggle-white').addClass('trgg-bwhite');

        }

        function setTopCss() {
            e.find('.bott').removeClass('bott');

            e.css({ 'top': v_top + 'px', 'left': v_left + 'px' });
            e.find('.trgg-bottom').removeClass('trgg-bottom').addClass('traggle-top');
            e.find('.trgg-bwhite').removeClass('trgg-bwhite').addClass('traggle-white');
        }

        //$(document).unbind('click').bind('click', function (e) {
        //    var $clicked = $(e.target);
        //    if (!$clicked.parents().hasClass("bubble-block")) {
        //        $clicked.parents().find('.bubble-block').hide();
        //    }
        //});
        $(this).show();
    }
    ,
    showBubbleWindowLR: function (obj, closeBtnId) {
        var _self = $(this);
        var v_top = $(obj).offset().top;
        var bodyW = $(window).width();
        var aW = $('body').width();
        var v_left = $(obj).offset().left + ($(obj).width() + parseInt($(obj).css('padding-left').replace('px', '')) + parseInt($(obj).css('padding-right').replace('px', ''))) / 2 - $(this).width() * 0.45 - 6;
        var h = $(this).outerHeight(true) + $(obj).offset().top;
        var eH = $(this).outerHeight(true);
        var hT = $(obj).offset().top - $(this).outerHeight(true) - 10;
        var t = $(obj).offset().top;
        v_top += $(obj).height();
        $(this).css({ 'top': v_top + 'px', 'left': v_left + 'px' });


        //绑定关闭事件
        if (closeBtnId != null && closeBtnId != undefined && closeBtnId != '') {
            $('#' + closeBtnId).unbind('click').click(function () {
                _self.hide();
            });
        }

        if (window.frames.length != parent.frames.length) {
            bodyH = window.frames.document.documentElement.clientHeight;
        }
        var bH = t % bodyH + eH + 10;

        var e = $(this);

        if (h > aH) {
            if (eH > t) {
                setTopCss();
            } else {
                setButtonCss();
            }

        } else {
            if (bH > bodyH) {
                if (eH > t) {
                    setTopCss();
                } else {
                    setButtonCss();
                }

            } else {
                setTopCss()
            }
        }


        function setButtonCss() {
            e.css({ 'top': hT + 'px' });

            e.find('.traggle-top').parents('div:first').addClass('bott');
            e.find('.traggle-top').removeClass('traggle-top').addClass('trgg-bottom');
            e.find('.traggle-white').removeClass('traggle-white').addClass('trgg-bwhite');

        }

        function setTopCss() {
            e.find('.bott').removeClass('bott');

            e.css({ 'top': v_top + 'px', 'left': v_left + 'px' });
            e.find('.trgg-bottom').removeClass('trgg-bottom').addClass('traggle-top');
            e.find('.trgg-bwhite').removeClass('trgg-bwhite').addClass('traggle-white');
        }

        //$(document).unbind('click').bind('click', function (e) {
        //    var $clicked = $(e.target);
        //    if (!$clicked.parents().hasClass("bubble-block")) {
        //        $clicked.parents().find('.bubble-block').hide();
        //    }
        //});
        $(this).show();
    }
    ,
    clearErrorInfo: function () {
        $(this).find('span.__errorInfo').remove();
    }
    ,
    getAllAttchment: function () {
        var res = new DataItem();
        res.Val = [];
        $(this).find('li').each(function (i) {
            var tmpid = $(this).attr('aid');
            var tmpurl = $(this).attr('url');
            var tmpname = $(this).attr('orname');
            var tmp = { aid: tmpid, path: tmpurl, orname: tmpname };
            res.Val.push(tmp);
        });

        return res;
    }
    ,
    handleTabs: function () {
        if (!$(this).hasClass('u-tab')) {
            return false;
        }
        var isClick = false;
        var tabs = $(this).find('.u-tabnav  li');
        tabs.on('click', function (e) {
            e.preventDefault();
            content = $(this).parents('.u-tab:first').find('.u-tabmain:first > div');
            var index = $(this).index();
            $(this).parents('ul:first').find('li').removeClass('u-tabnav-active');
            $(this).addClass('u-tabnav-active');
            content.removeClass('u-tabmain-active');
            content.eq(index).addClass('u-tabmain-active');
        })
    }
    ,
    handleCheckboxAndRadio: function () {
        if (!jQuery().uniform) {
            return;
        }
        var test = $(this).find("input[type=checkbox]:not(.toggle), input[type=radio]:not(.toggle, .star)");
        if (test.size() > 0) {
            test.each(function () {
                if ($(this).parents(".checker").size() == 0) {
                    $(this).show();
                    $(this).uniform();
                }
            });
        }
    }
    ,
    setSelectTab: function (setIndex) {
        if (!$(this).hasClass('u-tab')) {
            return false;
        }

        var _self = $(this);
        _self.find('ul.u-tabnav:first > li').removeClass('u-tabnav-active').eq(setIndex).addClass('u-tabnav-active');
        _self.find('div.u-tabmain:first > div').removeClass('u-tabmain-active').eq(setIndex).addClass('u-tabmain-active');
    }
    ,
    isSmallerDateThan: function (anotherDateInput) {
        var _self = $(this);
        var _another = $(anotherDateInput);
        if (_self.val() != '' && _another.val() != '') {
            var _self_date = new Date(_self.val());
            var _another_date = new Date(_another.val());
            if (_self_date <= _another_date) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    }
    ,
    validCustomStr: function (arrStr, altMsg) {
        var IsValid = true;
        var _self = $(this);
        _self.find('[iname]').each(function () {
            var v_txtVal = $(this).val();
            if (v_txtVal != null && v_txtVal != '' && v_txtVal != undefined) {
                for (var i = 0; i < arrStr.length; i++) {
                    if (arrStr[i] == v_txtVal) {
                        IsValid = false;
                        break;
                    }
                }
            }

            if (!IsValid) {
                return false;
            }
        });

        if (!IsValid) {
            var notStr = '';
            for (var i = 0; i < arrStr.length; i++) {
                notStr += ',' + arrStr[i];
            }
            if (notStr != '') {
                notStr = notStr.substr(1);
            }

            altMsg = altMsg + notStr;

            top.$.MsgBox.Alert('fail', altMsg);

        }
        return IsValid;
    }
});

function _f_switch_state(obj) {
    var v_no = $(obj).attr('controlno');
    if (!$(obj).hasClass('open')) {
        $(obj).parents('table').find('#child_' + v_no).show();
        $(obj).addClass('open');
        $(obj).find('img').prop('src', '/img/arrowblue.png');
    }
    else {
        $(obj).parents('table').find('#child_' + v_no).hide();
        $(obj).removeClass('open');
        $(obj).find('img').prop('src', '/img/arrowblue2.png');
    }
}

//--------------------------------------------------zTree----------------------------------------


function CreateAndGetTreeObj(fnClick) {
    var tree = {
        boxId: '',
        zTree: '',
        pNode: '',
        isMouseOnRMenu: false,
        rMenuId: '', //jquery选择器选择出来的右键菜单对象
        setting: {
            data: {
                simplyData: {
                    enable: true,

                }
            },
            //isSimpleData: true,
            //treeNodeKey: "id",
            //treeNodeParentKey: "pId",
            showLine: false,
            //root: {
            //    isRoot: true,
            //    nodes: []
            //},
            callback: {
                //onRightClick: function (event, treeId, treeNode) {
                //    tree.pNode = treeNode;
                //    if (!treeNode.noR) {
                //        //var row_link_id = treeNode.tId + "_a";
                //        //$('#' + tree.boxId).not('#' + row_link_id+',#'+tree.rMenuId).mouseenter(function () {
                //        //    tree.hideItem();
                //        //    $('#' + tree.boxId).not('#' + row_link_id + ',#' + tree.rMenuId).unbind('mouseenter');
                //        //});

                //        tree.showRightMenu({//显示右键菜单
                //            x: event.pageX,
                //            y: event.pageY
                //        });
                //    }
                //}
                onClick: function (event, treeId, treeNode) {
                    if (typeof (fnClick) == 'function') {
                        fnClick(event, treeId, treeNode);
                    }

                }
            }
        },
        init: {
            initEvent: {
                initRMenu: function () {
                    $('#' + tree.rMenuId).hover(
                    function () {//设置进入右键菜单事件
                        isMouseOnRMenu = true;
                        tree.bindClick($('#' + tree.rMenuId).find(".r_addFolder"), function () {
                            tree.addFolder();
                        });

                        tree.bindClick($('#' + tree.rMenuId).find(".r_addNode"), function () {
                            tree.addNode();
                        });

                        tree.bindClick($('#' + tree.rMenuId).find(".r_updateNode"), function () {
                            tree.updateNode();
                        });

                        tree.bindClick($('#' + tree.rMenuId).find(".r_deleteNode"), function () {
                            tree.deleteNode();
                        });
                    }
                    ,
                    function () {//设置离开右键菜单事件
                        isMouseOnRMenu = false;
                        tree.hideItem();
                    });
                }
            }
        },
        loadTree: function (ulid, jsonData, rightMenuId) {//加载树
            if ($('#' + rightMenuId).length == 0) {
                var rMenuHtml = '<div id="' + rightMenuId + '" class="rMenu">'
                                    + '<ul class="r_addFolder">'
                                    + '<li>增加文件夹</li>'
                                    + '</ul>'
                                    + '<ul class="r_addNode">'
                                    + '<li>增加节点</li>'
                                    + '</ul>'
                                    + '<ul class="r_updateNode">'
                                    + '<li>修改名称</li>'
                                    + '</ul>'
                                    + '<ul class="r_deleteNode">'
                                    + '<li>删除节点</li>'
                                    + '</ul>'
                                + '</div>';
                $('form:first').append(rMenuHtml);
            }
            tree.boxId = ulid;
            tree.rMenuId = rightMenuId;
            $.fn.zTree.init($("#" + ulid), tree.setting, jsonData);
            tree.zTree = $.fn.zTree.getZTreeObj(ulid);

            //$.fn.zTree.init($("#treeDemo4"), tree.setting, nodes);
            //tree.zTree = $.fn.zTree.getZTreeObj("treeDemo4");
        },
        showRightMenu: function (postionJson) {
            $('#' + tree.rMenuId).css({//设置右键菜单的位置
                top: postionJson.y + "px",
                left: postionJson.x + 2 + "px",
                display: "block"
            });

            if (tree.pNode.pId == 0) {//如果是根节点则禁用“删除”、“修改名称”选项
                //tree.showItem([".r_addFolder", ".r_addNode"]);
                tree.showItem([".r_addNode"]);
                //} else if (tree.pNode.isParent) {//如果是文件夹节点，则显示所有菜单选项
                //    tree.showItem([".r_addFolder", ".r_addNode", ".r_updateNode", ".r_deleteNode"]);
            } else {//此选项为节点，则禁用“增加节点”、“增加文件夹”选项
                tree.showItem([".r_addNode", ".r_updateNode", ".r_deleteNode"]);
                //tree.showItem([".r_addFolder", ".r_addNode", ".r_updateNode", ".r_deleteNode"]);
                //tree.showItem([".r_deleteNode", ".r_updateNode"]);
            }
            tree.init.initEvent.initRMenu();//加载菜单选项的事件
        },
        showItem: function (itemArray) {//显示某些域
            var menuid = tree.rMenuId;
            for (var i = 0; i < itemArray.length; i++) {
                $('#' + menuid + ' ' + itemArray[i]).show();
            }
        },
        hideItem: function (itemArray) {//隐藏某些域
            if (itemArray == undefined) {//如果为传入值，则禁用缺省的域
                var menuid = tree.rMenuId;
                tree.hideItem(["#" + menuid, "#" + menuid + " .r_addFolder", "#" + menuid + " .r_addNode", "#r_updateNode", "#r_deleteNode"]);
            }
            for (var i = 0; i < itemArray.length; i++) {
                $(itemArray[i]).hide();
            }
        },
        addFolder: function () {//添加文件夹节点
            var folderName = window.prompt("请输入文件夹的名称");
            if (folderName == "") {
                alert("操作失败！文件夹的名称不能为空!");
            } else {
                if (folderName != null) {
                    tree.zTree.addNodes(tree.pNode, [{//添加节点
                        id: tree.createNodeId(),
                        pId: tree.pNode.id,
                        name: folderName,
                        isParent: true
                    }]);
                }
            }
        },
        addNode: function () {//添加节点
            var nodeName = window.prompt("请输入节点名称");
            if (nodeName == "") {
                alert("操作失败！节点名称不能为空!");
            } else {
                if (nodeName != null) {
                    tree.zTree.addNodes(tree.pNode, [{//添加节点
                        id: tree.createNodeId(),
                        pId: tree.pNode.id,
                        name: nodeName,
                        isParent: false
                    }]);
                }
            }
        },
        updateNode: function () {//更新节点-修改节点名称
            var newName = window.prompt("输入新名称", tree.pNode.name);
            if (newName != tree.pNode.name && newName != null && newName != undefined) {
                tree.pNode.name = newName;
                tree.zTree.updateNode(tree.pNode, true);
            }
        },
        deleteNode: function () {//删除节点
            if (tree.pNode.isParent) {//判断该节点是否是文件夹节点，并且检查是否有子节点
                if (window.confirm("如果删除将连同子节点一起删掉。请确认！")) {
                    var parentNode = tree.zTree.getNodeByParam("id", tree.pNode.pid);//获取父节点对象
                    tree.zTree.removeNode(tree.pNode);//移除节点
                    parentNode.isParent = true;//设置父节点为文件夹节点
                    tree.zTree.refresh();
                }
            } else {//该节点为不是文件夹节点
                if (window.confirm("确认要删除?")) {
                    var parentNode = tree.zTree.getNodeByParam("id", tree.pNode.pid);
                    tree.zTree.removeNode(tree.pNode);//移除节点
                    parentNode.isParent = true;//设置父节点为文件夹节点
                    tree.zTree.refresh();
                }
            }
        },
        createNodeId: function () {//动态生成节点id。生成策略：在父节点id后追加递增数字
            var nodes = tree.zTree.getNodesByParam("pid", tree.pNode.id);
            if (nodes.length == 0) {//生成id的算法
                return tree.pNode.id + "1";
            } else {
                return nodes[nodes.length - 1].id + 1;
            }
        },
        bindClick: function (obj, fn) {//绑定click事件
            obj.unbind("click");
            obj.bind("click", fn);
        }
    };

    return tree;
}

//鼠标悬停操作按钮图标时候触发的事件
function OpOver(obj) {
    var v_width = $(obj).next().width();//弹出框自然宽度
    var v_tdWidth = $(obj).parents('td').width();//所属单元格宽度
    var v_shouldWidth = 0 - (v_width - (v_tdWidth / 2) + 20);

    $('div.notArea').show();
    $(obj).next().css({ 'position': 'absolute', 'left': v_shouldWidth + 'px' });
}

