<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getSocket } from '@/utils'
import InfoBoard from '@/components/infoboard/IndexView.vue'
import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores';

// // 用户仓库
const { role, roleId, playerName, roomId } = storeToRefs(useUserStore())

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
const roomConfigStage = computed(() => {
    return (props.roomConfig?.raidConfig === undefined || props.roomConfig?.raidConfig === null) ? true : false
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
    roomId.value = roomIdInput.value
    joinRoom()
    infoBoard.value.gameRoom = false
}

// 加入房间
const joinRoom = () => {
    // console.log('加入房间', id)
    setWebLoading(true)
    socket.emit('joinRoom', {
        roomId: roomId.value,
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
        player: {
            role: role.value,
            roleId: roleId.value,
            playerName: playerName.value
        }
    })
    roomId.value = ''
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
);

</script>
<template>
    <div id="room">
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
                <div class="room-block" v-for="(seat, i) in roomConfig?.seats" :key="seat" @click="sit(i)" :class="{
                    'active-block': seat?.playerName,
                }">
                    <p class="number">{{ i + 1 }} 号座位</p>
                    <p class="name" v-if="seat?.playerName">
                        玩家：{{ seat?.playerName }}
                    </p>
                    <p class="role" v-if="seat?.role">
                        角色：{{ seat?.role === 'titan' ? '泰坦' : '' }}
                        {{ seat?.role === 'hunter' ? '猎人' : '' }}
                        {{ seat?.role === 'warlock' ? '术士' : '' }}
                    </p>
                    <p class="sit" v-if="seat?.playerName === undefined">坐下</p>
                    <div :class="{
                        'back': seat?.playerName,
                        'titan': seat?.role === 'titan',
                        'hunter': seat?.role === 'hunter',
                        'warlock': seat?.role === 'warlock'
                    }"></div>
                </div>
            </div>
            <div class=" room-options">
                <el-button type="primary" size="large" @click="startGame"
                    v-if="playerConfig?.isCaptain">开始游戏</el-button>
                <el-button type="primary" size="large" @click="leaveRoom">退出房间</el-button>
            </div>
        </div>

        <!-- 房间信息版 -->
        <InfoBoard type="right" :show-info-board="(infoBoard.gameRoom && roomId === '') ? true : false">
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