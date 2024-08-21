<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSocket } from '@/utils'
import InfoBoard from '@/components/infoboard/IndexView.vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores'


// // 用户仓库
const { role, roleId, playerName, roomId } = storeToRefs(useUserStore())

// 父组件信息
const props = defineProps<{
  roomConfig: any
  playerConfig: any
  roomList: any
  infoBoard: any
  setWebLoading: (status: boolean) => void
  resetInfo: () => void
}>()

const roomConfig: any = computed(() => props.roomConfig)
const playerConfig: any = computed(() => props.playerConfig)
const roomList: any = computed(() => props.roomList)
const infoBoard: any = computed(() => props.infoBoard)
const setWebLoading = (status: boolean) => props.setWebLoading(status)
const resetInfo = () => props.resetInfo()


// 判断数据是否已收到
// 房间信息阶段
const roomConfigStage = computed(() => {
  return props.roomConfig?.roomId === undefined || props.roomConfig?.roomId === null
    ? true
    : false
})
// 玩家信息
// const playerConfigStage = computed(() => {
//     return (props.playerConfig?.playerStatus === undefined || props.playerConfig?.playerStatus === null) ? true : false
// })

// socket
let socket: any

// 房间号
const roomIdInput = ref('')


// 计算当前人数
const getPlayers = computed(() => {
  if (roomConfigStage.value) {
    return 0
  }
  return roomConfig.value.players.length
})

// 创建房间
const createRoom = () => {
  setWebLoading(true)
  socket.emit('createRoom', {
    player: {
      role: role.value,
      roleId: roleId.value,
      playerName: playerName.value
    }
  })
  infoBoard.value.gameRoom = false
}

// 加入房间
const setRoomId = () => {
  joinRoom(roomId.value)
  infoBoard.value.gameRoom = false
}

// 加入房间
const joinRoom = (id: string) => {
  // console.log('加入房间', id)
  setWebLoading(true)
  socket.emit('joinRoom', {
    roomId: id,
    player: {
      role: role.value,
      roleId: roleId.value,
      playerName: playerName.value
    }
  })
}

// 开始游戏
const startGame = () => {
  setWebLoading(true)
  socket.emit('startGame', {
    roomId: roomId.value
  })
}

// 退出房间
const leaveRoom = () => {
  socket.emit('leaveRoom', {
    roomId: roomId.value,
    playerName: playerName.value
  })
  roomId.value = ''
  resetInfo()
}

// 坐下
const sit = (i: number) => {
  const seatIndex = i
  setWebLoading(true)
  socket.emit('clickSeat', {
    seatIndex: seatIndex,
    roomId: roomId.value,
    playerName: playerName.value
  })
}

// 踢出房间
const kick = (name: string) => {
  socket.emit('kickPlayer', {
    roomId: roomId.value,
    playerName: name
  })
}

// 查看手牌
const showPlayerDeckList = (name: string) => {
  socket.emit('getPlayerDeckList', {
    roomId: roomId.value,
    playerName: name
  })
}

// 初始化
const init = () => {

  socket = getSocket()
}
init()

const isLoading = ref(true)
watch(
  () => [props.roomConfig, props.playerConfig],
  () => {
    if (props.roomConfig !== undefined && props.playerConfig !== undefined) {
      isLoading.value = false
    }
  },
  { immediate: true } // 立即执行，确保第一次赋值时触发
)
</script>
<template>
  <div id="room">
    <div class="template" v-if="roomId === ''">

    </div>

    <div class="options" v-if="roomId === ''">
      <el-button type="primary" @click="createRoom">创建房间（火力战队队长）</el-button>
      <el-input v-model="roomIdInput" placeholder="请输入房间号" maxlength="4"></el-input>
      <el-button type="primary" @click="setRoomId">加入房间（火力战队队员）</el-button>
    </div>

    <div class="room-box" v-else>
      <div class="room-info">
        <h2>房间号：{{ roomId }} 当前人数：{{ getPlayers }}</h2>
      </div>
      <div class="room-blocks">
        <div class="room-block" v-for="(seat, i) in roomConfig?.seats" :key="seat">
          <div class="info-block" :class="{
            'active-block': seat?.playerName
          }" @click="sit(i)">
            <p class="number">{{ i + 1 }} 号座位</p>
            <p class="name" v-if="seat?.playerName">玩家：{{ seat?.playerName }}</p>
            <div class="player-info" v-if="seat?.playerName">
              <div class="info">
                <p class="role" v-if="seat?.role">
                  角色：{{ seat?.role === 'titan' ? '泰坦' : '' }}
                  {{ seat?.role === 'hunter' ? '猎人' : '' }}
                  {{ seat?.role === 'warlock' ? '术士' : '' }}
                </p>
                <p class="money">
                  货币：{{ roomConfig?.playersInfo[seat?.playerName].playerMoney }}
                </p>
                <p class="draw-count">
                  抽卡次数：{{ roomConfig?.playersInfo[seat?.playerName].drawCount }}
                </p>
              </div>
            </div>

            <p class="sit" v-if="seat?.playerName === undefined">坐下</p>
            <div :class="{
              back: seat?.playerName,
              titan: seat?.role === 'titan',
              hunter: seat?.role === 'hunter',
              warlock: seat?.role === 'warlock'
            }"></div>
          </div>

          <div class="button-block">
            <el-button type="primary" class="show-button" v-if="seat?.playerName"
              @click="showPlayerDeckList(seat?.playerName)">查看手牌</el-button>
            <el-button type="danger" class="kick-button"
              v-if="playerConfig?.isCaptain && seat?.playerName !== playerName && seat?.playerName"
              @click="kick(seat?.playerName)">减除</el-button>
          </div>
        </div>
      </div>
      <div class="room-options">
        <el-button type="primary" size="large" @click="startGame" v-if="playerConfig?.isCaptain">开始游戏</el-button>
        <el-button type="primary" size="large" @click="leaveRoom">退出房间</el-button>
      </div>
    </div>

    <div class="room-list" v-if="roomId === ''">
      <h1>房间列表</h1>
      <div class="rooms" v-for="room in roomList" :key="room.roomId">
        <p>房主：{{ room.playerName }} - 人数：{{ room.players }}/6</p>
        <el-button type="success" size="small" @click="joinRoom(room.roomId)">加入房间</el-button>
      </div>
    </div>

    <!-- 房间信息版 -->
    <InfoBoard type="left" :show-info-board="infoBoard.gameRoom && roomId === '' ? true : false">
      <template #close-button>
        <div class="close-button">
          <a @click="infoBoard.gameRoom = !infoBoard.gameRoom">{{
            infoBoard.gameRoom ? '关闭' : '查看房间说明'
          }}</a>
        </div>
      </template>
      <template #title>
        <h1 class="title">房间说明</h1>
      </template>
      <template #content>
        <div>
          <p>由火力战队队长创建房间</p>
          <p>队员输入四位房间号进入房间</p>
          <p>玩家号码进入房间后选择</p>
        </div>
      </template>
    </InfoBoard>
  </div>
</template>
<style scoped lang="scss">
@import '@/assets/styles/room';
</style>
