<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { getSocket } from '@/utils'
import InfoBoard from '@/components/infoboard/IndexView.vue'

// 父组件信息
const props = defineProps<{
  roomConfig: any,
  playerConfig: any,
  infoBoard: any,
  setWebLoading: (status: boolean) => void,
}>()

const roomConfig: any = computed(() => props.roomConfig)
const playerConfig: any = computed(() => props.playerConfig)
const infoBoard: any = computed(() => props.infoBoard)
const setWebLoading = (status: boolean) => props.setWebLoading(status)

// 判断数据是否已收到
// 房间信息阶段
// const roomConfigStage = computed(() => {
//   return (props.roomConfig?.raidConfig === undefined || props.roomConfig?.raidConfig === null) ? true : false
// })
// // 玩家信息
// const playerConfigStage = computed(() => {
//   return (props.playerConfig?.playerStatus === undefined || props.playerConfig?.playerStatus === null) ? true : false
// })

// socket
let socket: any

// 属性
const eventFlipList: any = ref([])

// 接受事件
const acceptEvent = (index: number) => {
  setWebLoading(true)
  socket.emit('acceptGlobalEvent', {
    roomId: roomConfig.value.roomId,
    eventIndex: index
  })
}

// 完成事件
const finishEvent = (globalEvent: any, index: number) => {
  setWebLoading(true)
  socket.emit('finishGlobalEvent', {
    roomId: roomConfig.value.roomId,
    eventIndex: index
  })
}

// 初始化
const initGlobalEvent = () => {
  socket = getSocket()
  eventFlipList.value = Array.from({ length: roomConfig.value.globalEventList.length }, () => false)

  const changeCardState = setTimeout(() => {
    for (let i = 0; i < eventFlipList.value.length; i++) {
      eventFlipList.value[i] = true
    }
    clearTimeout(changeCardState)
  }, 100)
}

const isInitialized = ref(false);
const isLoading = ref(true)
watch(
  () => [props.roomConfig, props.playerConfig],
  () => {
    if (props.roomConfig !== undefined && props.playerConfig !== undefined) {
      isLoading.value = false
      if (!isInitialized.value) {
        initGlobalEvent()
        isInitialized.value = true
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
);
</script>

<template>
  <div id="globalevent" v-loading.fullscreen.lock="isLoading" element-loading-background="rgba(0, 0, 0, 0.8)">

    <h2 class="event-title" v-if="roomConfig?.globalEventList.length == 0">当前没有全局事件</h2>
    <h2 class="event-title" v-else>全局事件</h2>

    <div class="event-list">
      <div class="event-box" v-for="(globalEvent, index) in roomConfig?.globalEventList" :key="index">
        <div class="event-item" :class="{ flip: eventFlipList[index] }">
          <div class="event-card event-front">
            <div class="event-info">
              <div>
                <p class="title">{{ globalEvent.eventCnName }}</p>
                <p class="sub-title">{{ globalEvent.eventName }}</p>
              </div>
              <div>
                <p class="text">{{ globalEvent.eventDescription }}</p>
                <hr v-if="globalEvent.idea !== 'D2RRX'" />
                <p v-if="globalEvent.idea !== 'D2RRX'">想法来源：{{ globalEvent.idea }}</p>
              </div>
              <div class="buttons">
                <!-- <button class="button confirm" @click="acceptEvent(globalEvent, index)">
                  接受
                </button> -->
                <button class="button confirm" v-if="globalEvent.eventStatus === 'none' && playerConfig?.isCaptain"
                  @click="acceptEvent(index)">
                  接受
                </button>
                <button class="button finish" v-if="globalEvent.eventStatus === 'active' && playerConfig?.isCaptain"
                  @click="finishEvent(globalEvent, index)">
                  完成
                </button>
              </div>
            </div>
          </div>
          <div class="event-card event-back"></div>
        </div>
        <p class="event-name">- 全局事件 -</p>
      </div>
    </div>

    <!-- 全局事件信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gameGlobalEvent">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameGlobalEvent = !infoBoard.gameGlobalEvent">{{
            infoBoard.gameGlobalEvent ? '关闭' : '查看事件说明'
          }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">全局事件说明</h1>
      </template>
      <template #content>
        <div>
          <p>队长每次抵达遭遇战插旗点时</p>
          <p>都会刷新 1 - 2 个 全局事件</p>
          <p>若获得了事件，则必须立即查看该事件</p>
          <p>全局事件无法放弃，强制执行</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/globalevent';
</style>
