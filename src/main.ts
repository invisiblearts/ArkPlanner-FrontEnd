import Vue from 'vue';
import App from './App.vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
const VueAnalytics = require('vue-analytics').default

Vue.use(ElementUI);
Vue.use(VueAnalytics, {
  id: 'UA-144114297-1',
  autoTracking: {
    screenview: true
  }
})

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
