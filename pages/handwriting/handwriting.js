const app = getApp();
const { util } = app;
// 获取显示区域长宽
const device = wx.getSystemInfoSync()
// 中间操作区的宽高
const W = device.windowWidth;
const H = device.windowHeight - 80;
// const H = device.windowHeight - 138;
Page({
  data: {
    bgColor: '#fff',
    currentbgColor: 1,
    // 当前本地临时文件路径
    imgSrc: '',
    param: [1, 2, 4, 10, 25],
    currentparam: 0,
    //当前操作的文本
    selectTxtIndex: -1,
    canvasW: W,
    canvasH: H,
    addArrow: false,
    //画笔大小默认值
    penWidth: 2,
    //画笔形状默认值 line arrow
    penStyle: 'line',
    //画笔颜色
    color: ['#000000', '#ffffff', '#ff1d12', '#199bff', '#fbf606', '#15e214'],
    //画笔颜色默认值0
    currentColor: 0,
    fontSize: 20,
    showInput: false,
    txtFinish: true,
    selectBG: false,
    showHandwriting: false,
    // 以经保存的绘画数据
    operateArray: [],
    // 临时的绘画数据
    interimArray: [],
  },
  handwriting: {
    picture_list: [],
    pictures: []
  },
  moveStartX: 0, //保存X坐标轴变量
  moveStartY: 0, //保存Y坐标轴变量
  startX: 0, //保存X坐标轴变量
  startY: 0, //保存Y坐标轴变量
  openInputTimer: null,
  onLoad(e) {
    let that = this;
    this.cxtImg = wx.createCanvasContext('baseImg', that);
    this.context = wx.createCanvasContext('handwriting', that);
    that.setData({
      W: W,
      H: H
    })
  },
  _selectBG() {
    this.setData({
      selectBG: true
    })
  },
  _lastCanvasBG() {
    this.setData({
      canvasW: W,
      canvasH: H,
      imgSrc: '',
      bgColor: '#fff'
    })
  },
  _saveCanvasBG() {
    this.setData({
      selectBG: false
    })
  },
  _selectImg() {
    let that = this;
    if (that.data.operateArray.length > 0 || that.data.interimArray.length > 0) {
      util.showModal('提示', '你当前画布还未保存，你确定要更换背景吗？', true, '确定', function (res) {
        if (res.confirm) {
          wx.chooseImage({
            count: 1, // 默认9
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
              console.log(res)
              // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
              let tempFilePaths = res.tempFilePaths[0]
              that._loadIMG(tempFilePaths)
            }
          })
        }
      })
    } else {
      wx.chooseImage({
        count: 1, // 默认9
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: function (res) {
          console.log(res)
          // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
          let tempFilePaths = res.tempFilePaths[0]
          that._loadIMG(tempFilePaths)
        }
      })
    }
  },
  //手指触摸动作开始
  touchStart: function (e) {
    //得到触摸点的坐标
    this.startX = e.changedTouches[0].x;
    this.startY = e.changedTouches[0].y;
    //判断是线条还是箭头
    if (this.data.penStyle == 'line') {
      // 涂鸦画布
      this.context.save();
      this.context.beginPath();
      this.context.setStrokeStyle(this.data.color[this.data.currentColor])
      this.context.setLineWidth(this.data.penWidth)
      this.context.setLineCap('round') // 让线条圆润
      this.context.setLineJoin('round')
      // 放大画布
      this.cxtImg.save();
      this.cxtImg.beginPath();
      this.cxtImg.setStrokeStyle(this.data.color[this.data.currentColor])
      this.cxtImg.setLineWidth(this.data.penWidth * 2)
      this.cxtImg.setLineCap('round') // 让线条圆润
      this.cxtImg.setLineJoin('round')
    }
  },
  //手指触摸后移动
  touchMove: function (e) {
    let startX1 = e.changedTouches[0].x
    let startY1 = e.changedTouches[0].y
    //判断是线条还是箭头
    if (this.data.penStyle == 'line') {
      // 涂鸦画布
      this.context.moveTo(this.startX, this.startY)
      this.context.lineTo(startX1, startY1)
      this.context.stroke()
      this.context.draw(true)
      // 放大画布
      this.cxtImg.moveTo(this.startX * 2, this.startY * 2)
      this.cxtImg.lineTo(startX1 * 2, startY1 * 2)
      this.cxtImg.stroke()
      this.cxtImg.draw(true)
      this.startX = startX1;
      this.startY = startY1;
    } else if (this.data.penStyle == 'arrow') {
      let interimArrayLength = this.data.interimArray.length;
      if (interimArrayLength > 0) {
        //涂鸦画布
        this.context.save();
        this.context.beginPath();
        this.context.drawImage(this.data.interimArray[interimArrayLength - 1].src, 0, 0, this.data.canvasW, this.data.canvasH);
        // 放大画布
        this.cxtImg.save();
        this.cxtImg.beginPath();
        this.cxtImg.drawImage(this.data.interimArray[interimArrayLength - 1].src, 0, 0, 2 * this.data.canvasW, 2 * this.data.canvasH);
      }
      //涂鸦画布
      drawArrow(this.context, this.startX, this.startY, startX1, startY1, 30, 15, 2, this.data.color[this.data.currentColor]);
      // 放大画布
      drawArrow(this.cxtImg, this.startX * 2, this.startY * 2, startX1 * 2, startY1 * 2, 30, 30, 4, this.data.color[this.data.currentColor]);
    }
  },
  touchEnd() {
    this._saveCanvas(0)
  },
  /* 画图工具 */
  _selectparam(e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      currentparam: index,
      penWidth: this.data.param[index]
    })
  },
  _reducefont() {
    let fontSize = this.data.fontSize;
    fontSize--
    if (fontSize > 12) {
      this.data.interimArray[this.data.selectTxtIndex].style.fontSize = fontSize;
      this.data.interimArray[this.data.selectTxtIndex].style.lineHeight = fontSize + 10;
      this.setData({
        interimArray: this.data.interimArray,
        fontSize: fontSize
      })
    } else {
      this.data.interimArray[this.data.selectTxtIndex].style.fontSize = 12;
      this.data.interimArray[this.data.selectTxtIndex].style.lineHeight = 22;
      this.setData({
        interimArray: this.data.interimArray,
        fontSize: 12
      })
    }
  },
  _addfont() {
    let fontSize = this.data.fontSize;
    fontSize++
    if (fontSize < 100) {
      this.data.interimArray[this.data.selectTxtIndex].style.fontSize = fontSize;
      this.data.interimArray[this.data.selectTxtIndex].style.lineHeight = fontSize + 10;
      this.setData({
        interimArray: this.data.interimArray,
        fontSize: fontSize
      })
    } else {
      this.data.interimArray[this.data.selectTxtIndex].style.fontSize = 100;
      this.data.interimArray[this.data.selectTxtIndex].style.lineHeight = 110;
      this.setData({
        interimArray: this.data.interimArray,
        fontSize: 100
      })
    }
  },
  //选取背景图片
  // _setectBgImg(e) {
  //   let that = this;
  //   if (that.data.operateArray.length > 0 || that.data.interimArray.length > 0) {
  //     util.showModal('提示', '你当前画布还未保存，你确定要切换下一张吗？', true, '确定', function () {
  //       that._loadIMG(e.currentTarget.dataset.index)
  //     })
  //   } else {
  //     that._loadIMG(e.currentTarget.dataset.index)
  //   }
  // },
  //背景图片加载函数
  _loadIMG(url) {
    let that = this;
    util.showToast('加载中...')
    wx.getImageInfo({
      src: url,
      success(res) {
        util.hideToast()
        //计算画布的大小
        if (res.width >= res.height) {
          that.setData({
            operateArray: [],
            interimArray: [],
            imgSrc: res.path,
            canvasW: W,
            canvasH: W * res.height / res.width
          })
        } else {
          that.setData({
            operateArray: [],
            interimArray: [],
            imgSrc: res.path,
            canvasW: parseInt(res.width * (H - 40) / res.height),
            canvasH: H - 40
          })
        }
        //清空画布
        that.context.clearRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
        that.cxtImg.clearRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
      },
      fail(err) {
        util.hideToast()
        util.showModal('提示', '图片加载失败' + err.errMsg, false)
      }
    })
  },
  // 撤销上一步绘画路径
  _lastCanvas() {
    this._revoke(0)
  },
  //选取钢笔
  _penSelect: function (e) {
    this.data.penStyle = 'line'
    this.setData({
      addArrow: false,
      showHandwriting: true,
      showInput: false
    });
  },
  //选取钢笔
  _addArrow: function (e) {
    this.data.penStyle = 'arrow'
    this.setData({
      addArrow: true,
      showHandwriting: true,
      showInput: false
    });
  },
  //更改画笔颜色的方法
  _selectColor(e) {
    if (this.data.selectTxtIndex >= 0) {
      this.data.interimArray[this.data.selectTxtIndex].style.color = this.data.color[e.currentTarget.dataset.color];
      this.setData({
        interimArray: this.data.interimArray,
        currentColor: e.currentTarget.dataset.color
      });
    } else {
      this.setData({
        currentColor: e.currentTarget.dataset.color
      });
    }
  },
  _selectColorBG(e) {
    let that = this;
    if (that.data.operateArray.length > 0 || that.data.interimArray.length > 0) {
      util.showModal('提示', '你当前画布还未保存，你确定要更换背景吗？', true, '确定', function (res) {
        if (res.confirm) {
          //清空画布
          that.context.clearRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
          that.cxtImg.clearRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
          that.setData({
            operateArray: [],
            interimArray: [],
            canvasW: W,
            canvasH: H,
            imgSrc: '',
            currentbgColor: e.currentTarget.dataset.color,
            bgColor: that.data.color[e.currentTarget.dataset.color]
          });
        }
      })
    }else{  
      //清空画布
      this.context.clearRect(0, 0, 2 * this.data.canvasW, 2 * this.data.canvasH)
      this.cxtImg.clearRect(0, 0, 2 * this.data.canvasW, 2 * this.data.canvasH)
      this.setData({
        operateArray: [],
        interimArray: [],
        canvasW: W,
        canvasH: H,
        imgSrc: '',
        currentbgColor: e.currentTarget.dataset.color,
        bgColor: this.data.color[e.currentTarget.dataset.color]
      });
    }
  },
  _addText() {
    let textItem = {
      itemType: 'text',
      style: {
        width: 250,
        left: (this.data.canvasW - 250) / 2,
        top: (this.data.canvasH - 44) / 2,
        fontSize: this.data.fontSize,
        color: this.data.color[this.data.currentColor],
        lineHeight: this.data.fontSize + 10
      },
      lineCount: 1,
      content: ''
    }

    this.data.interimArray.push(textItem)
    this.setData({
      // textItem: this.data.textItem,
      selectTxtIndex: this.data.selectTxtIndex + 1,
      interimArray: this.data.interimArray,
      showHandwriting: false,
      txtFinish: false,
      showInput: true
    })
  },
  _textareaTouchStart(e) {
    let index = e.currentTarget.dataset.index;
    this.moveStartX = e.touches[0].pageX;
    this.moveStartY = e.touches[0].pageY;
    // 开启定时器判断用户是点击还是拖动
    this.openInputTimer = setTimeout(() => {
      this.setData({
        selectTxtIndex: index,
        showInput: true
      })
    }, 300)
  },
  _textareaTouchMove(e) {
    clearTimeout(this.openInputTimer)
    let index = e.currentTarget.dataset.index;
    //文字坐标
    let leftX = parseInt(this.data.interimArray[index].style.left + (e.touches[0].pageX - this.moveStartX));
    let leftY = parseInt(this.data.interimArray[index].style.top + (e.touches[0].pageY - this.moveStartY));
    //限制文字拖动范围
    // if (leftX < 0) {
    //   leftX = 0
    // }
    // if (leftY < 0) {
    //   leftY = 0
    // }
    // if (leftX > parseInt(W - this.data.textItem.style.width)) {
    //   leftX = parseInt(W - this.data.textItem.style.width)
    // }
    // if (leftY > parseInt(H - this.data.textItem.style.height)) {
    //   leftY = parseInt(H - this.data.textItem.style.height)
    // }

    // this.data.textItem.style.left = leftX;
    // this.data.textItem.style.top = leftY;
    // this.setData({
    //   textItem: this.data.textItem
    // })
    this.data.interimArray[index].style.left = leftX;
    this.data.interimArray[index].style.top = leftY;
    this.setData({
      interimArray: this.data.interimArray
    })
    //重新定位拖动起点
    this.moveStartX = e.touches[0].pageX;
    this.moveStartY = e.touches[0].pageY;
  },

  /* 控制输入框的宽高 */
  // 关闭输入框
  _confirmBtn() {
    this.setData({
      showInput: false,
      interimArray: this.data.interimArray
    })
  },
  //记录用户输入
  _bindinput(e) {
    if (!!e.detail.value) {
      this.data.interimArray[this.data.selectTxtIndex].content = e.detail.value;
    }
  },
  //用户点击键盘完成按钮
  _bindconfirm(e) {
    if (!!e.detail.value) {
      this.data.interimArray[this.data.selectTxtIndex].content = e.detail.value;
      this.setData({
        showInput: false,
        interimArray: this.data.interimArray
      })
    }
  },
  //记录文字行数
  _linechange(e) {
    if (e.detail.lineCount > 2) {
      this.data.interimArray[this.data.selectTxtIndex].lineCount = e.detail.lineCount;
    }
  },
  // 删除该段文字
  _deletTxt(e) {
    let index = e.currentTarget.dataset.index;
    this.data.interimArray.splice(index, 1);
    this.setData({
      interimArray: this.data.interimArray,
    })
  },
  //取消保存文字
  _lastTxt() {
    this.data.interimArray.pop();
    this.setData({
      interimArray: this.data.interimArray,
      showInput: false
    })
  },
  //保存文字
  _saveTxt() {
    if (this.data.interimArray.length > 0) {
      this.data.interimArray.map((obj) => {
        if (!!obj.content) {
          this.data.operateArray.push(obj)
        }
      })
      this.setData({
        selectTxtIndex: -1,
        txtFinish: true,
        operateArray: this.data.operateArray,
        showHandwriting: false,
        interimArray: []
      })
    } else {
      this.setData({
        selectTxtIndex: -1,
        txtFinish: true,
        interimArray: []
      })
    }
  },
  // restoreLast 0 撤销上一次临时绘画路径 1 撤销上一次绘画保存的画布
  _revoke(restoreLast = 1) {
    if (restoreLast == 0) {
      //清空画布
      this.cxtImg.clearRect(0, 0, this.data.canvasW * 2, this.data.canvasH * 2);
      this.context.clearRect(0, 0, this.data.canvasW, this.data.canvasH);
      this.data.interimArray.pop();
      if (this.data.interimArray.length > 0) {
        //绘制涂鸦
        this.context.save();
        this.context.beginPath();
        this.context.drawImage(this.data.interimArray[this.data.interimArray.length - 1].src, 0, 0, this.data.canvasW, this.data.canvasH);
        this.context.draw()
        //绘制涂鸦
        this.cxtImg.save();
        this.cxtImg.beginPath();
        this.cxtImg.drawImage(this.data.interimArray[this.data.interimArray.length - 1].src, 0, 0, 2 * this.data.canvasW, 2 * this.data.canvasH);
        this.cxtImg.draw()
      } else {
        this.context.draw()
        this.cxtImg.draw()
      }
      this.setData({
        interimArray: this.data.interimArray
      })
    } else {
      this.data.operateArray.pop();
      this.setData({
        operateArray: this.data.operateArray,
        interimArray: []
      })
    }
  },
  // restoreLast 0保存一次临时绘画路径 1保存整个画布
  _saveCanvas(restoreLast = 1) {
    let that = this;
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      destWidth: that.data.canvasW * 2,
      destHeight: that.data.canvasH * 2,
      canvasId: 'baseImg',
      success: function (res) {
        let imgItem = {
          itemType: 'image',
          src: res.tempFilePath
        }
        if (restoreLast == 0) {
          that.data.interimArray.push(imgItem)
          that.setData({
            interimArray: that.data.interimArray,
          })
        } else {
          that.data.operateArray.push(imgItem)
          that.setData({
            interimArray: [],
            operateArray: that.data.operateArray,
            showHandwriting: false
          })
          //清空画布
          that.cxtImg.clearRect(0, 0, that.data.canvasW * 2, that.data.canvasH * 2);
          that.context.clearRect(0, 0, that.data.canvasW, that.data.canvasH);
        }
      }
    })
  },
  _saveImg() {
    let that = this;
    if (that.data.operateArray.length > 0 || that.data.interimArray.length > 0) {
      util.showToast('正在保存...')
      //清空画布
      that.cxtImg.clearRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
      if (!!that.data.imgSrc) {
        //绘制底图
        that.cxtImg.save();
        that.cxtImg.beginPath();
        that.cxtImg.drawImage(that.data.imgSrc, 0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH);
      } else {
        that.cxtImg.save();
        that.cxtImg.beginPath();
        that.cxtImg.setFillStyle(that.data.bgColor);
        that.cxtImg.fillRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
      }
      let operateArrayLength = that.data.operateArray.length;
      for (let i = 0; i < operateArrayLength; i++) {
        if (that.data.operateArray[i].itemType == 'text') {
          //计算每一行的字数
          let start = 0;
          let lineCount = that.data.operateArray[i].lineCount;
          let stringNum = parseInt(that.data.operateArray[i].content.length / that.data.operateArray[i].lineCount);
          //绘制文字
          for (let j = 0; j < lineCount; j++) {
            that.cxtImg.save();
            that.cxtImg.beginPath();
            that.cxtImg.setFontSize(that.data.operateArray[i].style.fontSize * 2)
            that.cxtImg.setTextAlign('center')
            that.cxtImg.setTextBaseline('bottom')
            that.cxtImg.setFillStyle(that.data.operateArray[i].style.color)
            that.cxtImg.fillText(that.data.operateArray[i].content.substring(start, start + stringNum), that.data.operateArray[i].style.left * 2 + this.data.operateArray[i].style.width, that.data.operateArray[i].style.top * 2 + that.data.operateArray[i].style.lineHeight * 2 * (j + 1));
            that.cxtImg.setFontSize(that.data.operateArray[i].style.fontSize);
            that.cxtImg.setFillStyle(that.data.operateArray[i].style.color);
            that.cxtImg.setTextBaseline('middle');
            start += stringNum + 1;
          }
        } else if (that.data.operateArray[i].itemType == 'image') {
          //绘制涂鸦
          that.cxtImg.save();
          that.cxtImg.beginPath();
          that.cxtImg.drawImage(that.data.operateArray[i].src, 0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH);
        }
      }
      that.cxtImg.draw(false, function (res) {
        console.log(res.tempFilePath)
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          destWidth: that.data.canvasW * 2,
          destHeight: that.data.canvasH * 2,
          fileType: 'jpg',
          canvasId: 'baseImg',
          success: function (res) {
            //上传图片
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success(res) {
                util.hideToast()
                util.showModal('提示', '图片已保存到您的手机相册', false)
              },
              fail(err) {
                util.hideToast()
                wx.getSetting({
                  success(res) {
                    if (!res.authSetting['scope.writePhotosAlbum']) {
                      service.util.showModal('提示', '您已拒绝授权，所以无法保存图片', true, '重新授权',
                        function (res) {
                          if (res.confirm) {
                            wx.openSetting()
                          }
                        })
                    } else {
                      util.showModal('提示', '图片保存失败,请尝试重新保存:' + err.errMsg, false)
                    }
                  }
                })
              }
            })
          },
          fail(err) {
            util.hideToast();
            util.showModal('提示', '图片保存失败,请尝试重新保存:' + err.errMsg, false)
          }
        })
      })
    } else {
      util.hideToast();
      util.showModal('提示', '你当前画布还未进行编辑，无法进行保存', false)
    }
    //清空画布
    that.cxtImg.clearRect(0, 0, 2 * that.data.canvasW, 2 * that.data.canvasH)
  }
})

/* 绘制箭头函数 */
// ctx：Canvas绘图环境
// fromX, fromY：起点坐标（也可以换成p1，只不过它是一个数组）
// toX, toY：终点坐标(也可以换成p2，只不过它是一个数组)
// theta：三角斜边一直线夹角
// headlen：三角斜边长度
// width：箭头线宽度
// color：箭头颜色
function drawArrow(ctx, fromX, fromY, toX, toY, theta, headlen, width, color) {
  theta = typeof (theta) != 'undefined' ? theta : 30;
  headlen = typeof (theta) != 'undefined' ? headlen : 10;
  width = typeof (width) != 'undefined' ? width : 1;
  color = typeof (color) != 'color' ? color : '#000';
  let angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
    angle1 = (angle + theta) * Math.PI / 180, angle2 = (angle - theta) * Math.PI / 180,
    topX = headlen * Math.cos(angle1), topY = headlen * Math.sin(angle1),
    botX = headlen * Math.cos(angle2), botY = headlen * Math.sin(angle2); ctx.save();

  let arrowX = fromX - topX,
    arrowY = fromY - topY;
  ctx.save();
  ctx.beginPath();
  ctx.setStrokeStyle(color)
  ctx.setLineWidth(width)
  ctx.setLineJoin('miter')
  ctx.moveTo(arrowX, arrowY);
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);

  arrowX = toX + topX;
  arrowY = toY + topY;
  ctx.setFillStyle(color)
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  arrowX = toX + botX;
  arrowY = toY + botY;
  ctx.lineTo(arrowX, arrowY);
  ctx.fill();
  ctx.restore();
  ctx.draw();
}
