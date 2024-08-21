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

// 赏金状态
const flipStage = ref(Array.from({ length: 3 }, () => false))

// 赏金任务完成
const finishBounty = () => {
  socket.emit('finishBounty', {
    roomId: roomConfig.value.roomId,
    playerName: playerConfig.value.playerName
  })
  setWebLoading(true)

  // 清空赏金任务列表
  for (let i = 0; i < 3; i++) {
    flipStage.value[i] = false
  }
}

//初始化
const initBounty = () => {
  socket = getSocket()

  const changeButtonState = setTimeout(() => {
    flipStage.value = Array.from({ length: 3 }, () => true)
    clearTimeout(changeButtonState)
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
        initBounty()
        isInitialized.value = true
      }
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
);
</script>

<template>
  <div id="bounty" v-loading.fullscreen.lock="isLoading" element-loading-background="rgba(0, 0, 0, 0.8)">
    <div class="bounty-title">
      <h1>赏金任务三选一执行，可获得 3-5 个单位货币 + 1 次抽卡机会</h1>
    </div>
    <div class="bounty-list">
      <div class="bounty-box" v-for="(bounty, index) in playerConfig?.bountyList" :key="index">
        <div class="bounty-item" :class="{ flip: flipStage[index] }" :id="'bounty-' + (index + 1)">
          <div class="bounty-card bounty-front">
            <div class="bounty-info">
              <div>
                <p class="title">{{
                  bounty.bountyCnName !== "" ? bounty.bountyCnName : "当前没有赏金任务"
                  }}</p>
                <p class="sub-title">{{ bounty.bountyName }}</p>
              </div>
              <div>
                <p class="text">{{
                  bounty.bountyDescription !== "" ? bounty.bountyDescription : "请过段时间再来"
                  }}</p>
                <hr v-if="bounty.idea !== 'D2RRX'" />
                <p v-if="bounty.idea !== 'D2RRX'" class="idea">想法来源：{{ bounty.idea }}</p>
              </div>
              <button class="button" @click="finishBounty" v-if="bounty.bountyId !== 'V0'">已完成</button>
            </div>
          </div>
          <div class="bounty-card bounty-back"></div>
        </div>

        <p class="bounty-name">- 赏金任务 -</p>
      </div>
    </div>

    <!-- 赏金信息版 -->
    <InfoBoard type="right" :show-info-board="infoBoard.gameBounty">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameBounty = !infoBoard.gameBounty">{{
            infoBoard.gameBounty ? '关闭' : '查看赏金说明'
            }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">赏金说明</h1>
      </template>
      <template #content>
        <div>
          <p>每次抵达遭遇战前，都会刷新三个不同类型的赏金任务</p>
          <hr />
          <p>赏金任务三选一执行，可获得 3-5 个单位货币 +1 次抽卡机会</p>
          <hr />
          <p>悬赏仅可在遭遇战中完成</p>
          <p>悬赏可自由接取，未完成没有惩罚</p>
          <p>悬赏失败后就无法再完成，无法通过团灭重置</p>
          <p>悬赏必须在遭遇战结束后才算完成</p>
          <p>个别悬赏可以瞬间完成，例如 看板 类型悬赏</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/styles/bounty';
</style>
