<template>
  <view :style="windowMinHeightStr" class="poster">
    <view class="poster-inner">
      <canvas
        id="myCanvas"
        canvas-id="myCanvas"
        style="width: 750px; height: 1190px; position: fixed; top: -20000rpx"
      ></canvas>
      <view class="title title-animation">若隐若现</view>
      <view class="sign sign-animation" v-if="showSignAnimation">
        <view class="sign-title">{{ option.title }}</view>
        <view class="sign-text">
          <view v-for="(item, index) in contextArr" :key="index">
            {{ item }}
          </view>
        </view>
      </view>
      <view class="btn" @tap="handlePoster(option)">点我</view>
    </view>
  </view>
</template>

<script>
import minHeight from '@/mixins/minHeight';
export default {
  mixins:[minHeight],
  data() {
    return {
      showSignAnimation: false,
      timer: null,
      ratio: 1,
      ctx: null, // 创建canvas对象
      canvasToTempFilePath: null, // 保存最终生成的导出的图片地址

      option: {
        //绘制海报内容
        // bgUrl: '/static/images/poster/poster.png', //图片背景填充，和 fillStyle 只能传一个，bgUrl 优先级高于 fillStyle
        // bgUrl: 'https://img.alicdn.com/tps/TB1sXGYIFXXXXc5XpXXXXXXXXXX.jpg', //图片背景填充，和 fillStyle 只能传一个，bgUrl 优先级高于 fillStyle
        bgUrl: 'https://mn-duoshanghu.oss-cn-beijing.aliyuncs.com//5a76e202201252010102897.jpg', //图片背景填充，和 fillStyle 只能传一个，bgUrl 优先级高于 fillStyle
        title: '哈哈哈',
        context: '大家好大家好大家好'
      }
    };
  },
  computed: {
    contextArr() {
      let row = Math.ceil(this.option.context.length / 5);
      console.log('contextArr row:', row);
      let tmpArr = [];
      for (let index = 0; index < row; index++) {
        console.log('index', index);
        let item = this.option.context.split('').slice(index * 5, (index + 1) * 5);
        item = item.join('');
        tmpArr.push(item);
      }
      console.log('contextArr tmpArr:', tmpArr);
      return tmpArr;
    }
  },
  watch: {},
  methods: {
    clearTimer() {
      clearTimeout(this.timer);
      this.timer = null;
    },
    // 生成海报
    async handlePoster(option) {
      console.log('handlePoster run');
      // 点击生成海报数据埋点
      if (!this.ctx) {
        uni.showLoading({
          title: '生成海报中'
        });
        const ctx = uni.createCanvasContext('myCanvas', this);
        ctx.drawImage(option.bgUrl, 0, 0, 750, 1190); // 背景图片需要本地

        if (option.context) {
          ctx.font = 'normal 500 44px sans-serif'; // 字体
          ctx.setFillStyle('#fff'); // 文字颜色
          this.dealWords({
            ctx: ctx, //画布上下文
            fontSize: 54, //字体大小
            word: option.context, //需要处理的文字
            maxOneLine: 5, //一行文字个数
            x: 278, //文字在x轴要显示的位置
            y: 480, //文字在y轴要显示的位置
            maxLine: 7 //文字最多显示的行数
          });
        }

        if (option.title) {
          ctx.font = 'normal 500 58px sans-serif';
          ctx.setFillStyle('#fff'); // 文字颜色
          ctx.fillText(option.title, 298, 398); // 绘制文字
        }

        ctx.draw(false, res => {
          // canvas画布转成图片并返回图片地址
          this.timer = setTimeout(() => {
            ctx.toTempFilePath(
              {
                fileType: 'jpg',
                quality: 0.95,
                canvasId: 'myCanvas',
                success: res => {
                  console.log('res :>> ', res);
                  this.canvasToTempFilePath = res.tempFilePath || res.apFilePath;
                  this.saveShareImg(this.canvasToTempFilePath); //保存到相册
                  // this.urlTobase64(ctx); //保存到服务器:暂时不用
                },
                fail: err => {
                  uni.showToast({
                    title: '绘制海报失败'
                  });
                },
                complete: () => {
                  uni.hideLoading();
                  uni.hideToast();
                }
              },
              this
            );
          }, 100);
        });
      }
    },
    urlTobase64(ctx) {
      //可通过设置fileType和quality来设置图片的格式和质量
      ctx.toDataURL('image/jpeg', 0.1).then(dataURL => {
        console.log('dataURL:\n', dataURL, typeof dataURL);
        this.$api
          .uploadImage({ number: this.$store.state.userInfo.number, file: dataURL })
          .then(res => {
            console.log(`上传图片 res:`, res);
          })
          .catch(err => {
            console.log(`上传图片 err:`, err);
            throw new Error('上传图片失败');
          });
      });
    },

    //处理文字多出省略号显示
    dealWords(options) {
      console.log('dealWords options :>> ', options);
      options.ctx.setFontSize(options.fontSize); //设置字体大小
      let allRow = Math.ceil(options.word.length / options.maxOneLine);
      let count = allRow >= options.maxLine ? options.maxLine : allRow; //实际能分多少行与设置的最大显示行数比，谁小就用谁做循环次数
      let endPos = 0; //当前字符串的截断点
      for (let j = 0; j < count; j++) {
        let nowStr = options.word.slice(endPos); //当前剩余的字符串
        let rowWid = 0; //每一行当前宽度
        if (nowStr.length > options.maxOneLine) {
          //如果当前的字符串宽度大于最大宽度，然后开始截取
          for (let m = 0; m < nowStr.length; m++) {
            rowWid += nowStr[m].length; //当前字符串总宽度
            if (rowWid > options.maxOneLine) {
              if (j === options.maxLine - 1) {
                //如果是最后一行
                options.ctx.fillText(nowStr.slice(0, m - 1) + '...', options.x, options.y + (j + 1) * 50); //(j+1)*18这是每一行的高度
              } else {
                options.ctx.fillText(nowStr.slice(0, m), options.x, options.y + (j + 1) * 50);
              }
              endPos += m; //下次截断点
              break;
            }
          }
        } else {
          //如果当前的字符串宽度小于最大宽度就直接输出
          options.ctx.fillText(nowStr.slice(0), options.x, options.y + (j + 1) * 50);
        }
      }
    },

    // 保存到系统相册
    saveShareImg(canvasToTempFilePath) {
      uni.saveImageToPhotosAlbum({
        filePath: canvasToTempFilePath,
        success: () => {
          uni.showModal({
            title: '提示:',
            content: '海报已保存到相册中 记得将你的牛运分享',
            showCancel: false,
            confirmText: '知道了'
          });
        },
        fail: () => {
          uni.showToast({
            title: '保存海报失败'
          });
        }
      });
    }
  },
  onLoad(option) {
    if (option.title) {
      this.$set(this.option, 'title', option.title);
    }
    if (option.context) {
      this.$set(this.option, 'context', option.context);
    }

    this.timer = setTimeout(() => {
      this.showSignAnimation = true;
    }, 1500);
  },
  onShow() {},
  onHide() {
    this.timer && this.clearTimer();
  },
  onUnload() {
    this.timer && this.clearTimer();
  },
  beforeDestroy() {
    console.log('beforeDestroy poster run～～～');
  },
  destroyed() {
    console.log('destroyed poster run～～～');
  }
};
</script>

<style lang="scss" scoped>
.poster {
  width: 750rpx;
  height: 1190rpx;
  overflow: hidden;
  background-color: skyblue;

  .poster-inner {
    width: 100%;
    height: 100%;
    // height: 1190rpx;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    // background
    // background-image: url('~@/static/images/poster/poster-bg.png');
    background-color: skyblue;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-size: 100% 100%;
    // position
    position: relative;

    .title {
      width: 390rpx;
      height: 78rpx;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      // background
      // background-image: url('~@/static/images/poster/poster-title.png');
      background-color: #eee;
      background-repeat: no-repeat;
      background-position: 0 0;
      background-size: 100% 100%;
      // position
      position: absolute;
      top: 52rpx;
      left: 50%;
      z-index: 9;
      transform: translateX(-50%);
    }

    .title-animation {
      animation-name: flash2;
      animation-duration: 6s;
      animation-iteration-count: infinite;
    }

    .sign {
      width: 502rpx;
      height: 924rpx;
      // background
      // background-image: url('~@/static/images/poster/poster-sign-bg.png');
      background-color: #ccc;
      background-repeat: no-repeat;
      background-position: 0 0;
      background-size: 100% 100%;
      // position
      position: absolute;
      top: 149rpx;
      left: 130rpx;
      z-index: 9;
      // flex
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      .sign-title {
        width: 186rpx;
        height: 56rpx;
        line-height: 56rpx;
        font-size: 58rpx;
        font-weight: 500;
        color: #fff9b1;
      }
      .sign-text {
        padding-top: 76rpx;
        width: 225rpx;
        // height: 373rpx;
        font-size: 44rpx;
        line-height: 60rpx;
        text-align: center;
        font-weight: 500;
        color: #ffffff;
        // flex
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }

    .sign-animation {
      animation-name: zoomIn;
      animation-duration: 2s;
    }

    .btn {
      width: 272rpx;
      height: 69rpx;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      // background
      // background-image: url('~@/static/images/poster/poster-btn.png');
      background-color: #ccc;
      background-repeat: no-repeat;
      background-position: 0 0;
      background-size: 100% 100%;
      // position
      position: absolute;
      top: 1094rpx;
      left: 50%;
      z-index: 9;
      transform: translateX(-50%);
    }
  }
}
</style>
