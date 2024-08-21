<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { getSocket } from '@/utils'
import InfoBoard from '@/components/infoboard/IndexView.vue'

// 父组件信息
const props = defineProps<{
  roomConfig: any
  playerConfig: any
  infoBoard: any
  setWebLoading: (status: boolean) => void
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
  socket.emit('acceptPlayerEvent', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    eventIndex: index
  })
}

// 完成事件
const finishEvent = (index: number) => {
  setWebLoading(true)
  socket.emit('finishPlayerEvent', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    eventIndex: index
  })
}

// 放弃事件
const dropEvent = (index: number) => {
  setWebLoading(true)
  socket.emit('dropPlayerEvent', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName,
    eventIndex: index
  })
}

// 初始化
const initPlayerEvent = () => {
  socket = getSocket()

  eventFlipList.value = Array.from(
    { length: playerConfig.value.playerEventList.length },
    () => false
  )

  const changeCardState = setTimeout(() => {
    for (let i = 0; i < eventFlipList.value.length; i++) {
      eventFlipList.value[i] = true
    }
    clearTimeout(changeCardState)
  }, 100)
}

const isInitialized = ref(false)
watch(
  () => [props.roomConfig, props.playerConfig],
  () => {
    if (props.roomConfig !== undefined && props.playerConfig !== undefined) {
      if (!isInitialized.value) {
        initPlayerEvent()
        isInitialized.value = true
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
)
</script>
<template>
  <div id="playerevent">
    <h2 class="event-title" v-if="playerConfig?.playerEventList.length == 0">当前没有个人事件</h2>
    <h2 class="event-title" v-else>个人事件</h2>

    <div class="event-list">
      <div class="event-box" v-for="(playerEvent, index) in playerConfig?.playerEventList" :key="index">
        <div class="event-item" :class="{ flip: eventFlipList[index] }">
          <div class="event-card event-front">
            <div class="event-info">
              <div>
                <p class="title">{{ playerEvent.eventCnName }}</p>
                <p class="sub-title">{{ playerEvent.eventName }}</p>
              </div>
              <div>
                <p class="text">{{ playerEvent.eventDescription }}</p>
                <hr v-if="playerEvent.idea !== 'D2RRX'" />
                <p v-if="playerEvent.idea !== 'D2RRX'">想法来源：{{ playerEvent.idea }}</p>
              </div>
              <div class="buttons">
                <!-- <button class="button confirm" @click="acceptEvent(playerEvent, index)">
                  接受
                </button> -->
                <button class="button confirm" v-if="playerEvent.eventStatus === 'none'" @click="acceptEvent(index)">
                  接受
                </button>
                <button class="button finish" v-else @click="finishEvent(index)">完成</button>
              </div>
            </div>
          </div>
          <div class="event-card event-back"></div>
        </div>
        <button class="button quit" v-if="playerEvent.eventStatus === 'none'" @click="dropEvent(index)">
          放弃
        </button>
        <p class="event-name">- 个人事件 -</p>
      </div>
    </div>

    <!-- 个人事件信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gamePlayerEvent">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gamePlayerEvent = !infoBoard.gamePlayerEvent">{{
            infoBoard.gamePlayerEvent ? '关闭' : '查看事件说明'
            }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">个人事件说明</h1>
      </template>
      <template #content>
        <div>
          <p>玩家每次抵达遭遇战插旗点时</p>
          <p>都会刷新 1 - 3 个 个人事件</p>
          <p>若获得了事件，则必须立即查看该事件</p>
          <p>个人事件放弃则抽取一次特殊卡牌</p>
          <p>完成事件后有概率获得 1 - 3 个单位货币</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/playerevent';
</style>
