<template lang="pug">
p Backend by #[el-link(href='https://github.com/ycremar') @ycremar], 
    | frontend by #[el-link(href='https://github.com/invisiblearts') @invisiblearts]
    | . See #[el-link(href='https://github.com/ycremar/ArkPlanner') GitHub] for details.
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class ArkplannerFooter extends Vue {

}
</script>


<style lang="stylus" scoped>
.el-link
    vertical-align: baseline
    font-size: 100%
</style>
