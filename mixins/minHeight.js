export default {
  data() {
    return {
      windowHeight: 0,
      screenHeight: 0,
      windowMinHeightStr: '', // window高度
      screenMinHeightStr: '' // screen高度
    };
  },
  watch: {
    windowHeight(val) {
      if (val && val > 0) {
        this.windowMinHeightStr = 'height:' + this.windowHeight + 'rpx;min-height:' + this.windowHeight + 'rpx;';
      }
    },
    screenHeight(val) {
      if (val && val > 0) {
        this.screenMinHeightStr = 'min-height:' + this.screenHeight + 'rpx;';
      }
    }
  },
  mounted() {
    console.log('minHeight mixin 执行');
    this.screenHeight = uni.getSystemInfoSync().screenHeight * (750 / uni.getSystemInfoSync().screenWidth);
    this.windowHeight = uni.getSystemInfoSync().windowHeight * (750 / uni.getSystemInfoSync().windowWidth);
  }
};
