<script lang="ts" setup>
import { ref, computed } from 'vue'
import { getSocket } from '@/utils'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores'

const { roomId, playerName } = storeToRefs(useUserStore())

// 父组件信息
const props = defineProps<{
  playerConfig: any
  setWebLoading: (status: boolean) => void
  title: string
}>()

const playerConfig: any = computed(() => props.playerConfig)
const setWebLoading = (status: boolean) => props.setWebLoading(status)

// socket
let socket = getSocket()

// 基础属性
const visible = ref(false)
const valueInput = ref(0)
const dialogType = ref('')

// 输入框变化
const handleChange = (value: number) => {
  if (dialogType.value === 'money') {
    setWebLoading(true)
    socket.emit('setMoney', {
      roomId: roomId.value,
      playerName: playerName.value,
      money: value
    })
  } else if (dialogType.value == 'draw') {
    setWebLoading(true)
    socket.emit('setDrawCount', {
      roomId: roomId.value,
      playerName: playerName.value,
      drawCount: value
    })
  }
}

// 打开模态框
const open = (type: string) => {
  if (type === 'money') {
    valueInput.value = playerConfig?.value?.playerMoney
  } else if (type === 'draw') {
    valueInput.value = playerConfig?.value?.drawCount
  }
  dialogType.value = type
  visible.value = true
}

// 关闭模态框
const close = () => {
  visible.value = false
}

// 导出方法
defineExpose({
  open,
  close
})
</script>

<template>
  <el-dialog
    class="dialog value-dialog"
    v-model="visible"
    :close-on-click-modal="false"
    width="25rem"
    align-center
  >
    <div class="value-input-box">
      <label for="value">{{ props.title }}：</label>
      <el-input-number
        v-model="valueInput"
        :min="-100"
        :max="100"
        @change="handleChange"
        id="value"
      />
    </div>
    <div class="buttons">
      <button type="button" class="button value-cancel" @click="close">关闭</button>
    </div>
  </el-dialog>
</template>

<style lang="scss">
// 货币/抽卡次数模态框样式
.value-dialog {
  clip-path: polygon(
    3rem 0%,
    100% 0%,
    100% calc(100% - 3rem),
    calc(100% - 3rem) 100%,
    0 100%,
    0% 3rem
  ) !important;

  .value-input-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80%;

    label {
      color: white;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
  }

  .buttons {
    display: flex;
    margin-top: 1rem;

    button {
      padding: 0.25rem 4em;
    }
  }
}
</style>
