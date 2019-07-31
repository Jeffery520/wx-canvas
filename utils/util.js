module.exports = {
  storage,
  showModal,
  showToast,
  hideToast,
  getNetworkType
}


/* 
 *@:title:统一缓存操作入口 
 *@:params: action set设置/get获取/remove清空,key必须在 storegeList允许范围内,
 *          data字符串,默认sync操作
 *@:return: 查询操作 false/result  修改操作 true/false
 *@:author: JefferyLiang 2017/12/23
 */
function storage(action, key, data, sync = true) {
  var result = false
  var error = ''

  switch (action) {
    case 'set':
      try {
        wx.setStorageSync(key, data)
        result = true
      } catch (e) {
        error = e.error
      }
      break;
    case 'get':
      try {
        result = wx.getStorageSync(key)
      } catch (e) {
        error = e.error
      }
      break;
    case 'remove':
      try {
        wx.removeStorageSync(key)
        result = true
      } catch (e) {
        error = e.error
      }
      break;
  }
  return result
}

/* 
 *@:title:统一系统提示入口 
 *@:params: str 描述语句 , showCancel false 无取消按钮  ,fn回调函数
 *@: return void
 *@:author: JefferyLiang 2017/12/27
 */
function showModal(title = '系统提示', str = '', showCancel = true, confirmText = '确定', fn) {
  if (str == '') {
    str = ''
  }
  wx.showModal({
    title: title,
    content: str,
    showCancel: showCancel,
    confirmText: confirmText,
    success: function (res) {
      return typeof fn == 'function' && fn(res);
    }
  })
}

/*
 *@: 系统显示提醒
 *@: params string str, icon 'success'/'loading' ,duration 
 *@: return void
 *@:author: JefferyLiang 2017/12/27
 */
function showToast(title = '加载中...', icon = 'loading', duration = 60000) {
  wx.showToast({
    title: title,
    mask: true,
    icon: icon,
    duration: duration
  })
}

/*
 *@: 系统隐藏提醒
 *@: params void
 *@: return void
 *@: author: JefferyLiang 2017/12/27
 */
function hideToast() {
  wx.hideToast()
}
/*
 *@: 获取当前网络状态
 *@: params 回调函数
 *@: return 回调函数
 *@: author: JefferyLiang 2017/12/27
 */
function getNetworkType(fn) {
  wx.getNetworkType({
    success: function (res) {
      return typeof fn == 'function' && fn(res);
    },
    fail: function () {
      let err = { errMsg: "getNetworkType:fail", networkType: "error" }
      return typeof fn == 'function' && fn(err);
    }
  })
}
