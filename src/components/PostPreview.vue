<template>
  <q-dialog v-model="confirm" persistent @hide="handleDialogHide">
    <q-card>
      <q-card-section class="row items-center">
        <q-img
          v-for="image in images"
          :src="image.src"
          alt="picture preview"
          :key="image.src"
          width="300px"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Turn on Wifi" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script lang="ts">
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { defineComponent, ref } from 'vue';

export type QuasarBEXPayload = {
  eventResponseKey: string;
} & Record<string, any>;

interface Image {
  src: string;
  author: string;
}
interface Post {
  images: Array<Image>;
}

export default defineComponent({
  setup() {
    const $q = useQuasar();
    const confirm = ref(false);
    const images = ref<Image[]>([]);

    $q.bex.on('open.preview', async (payload) => {
      const { data } = payload as QuasarBEXPayload;

      console.log('vue', data.src, payload);

      confirm.value = true;
      images.value = [
        ...images.value,
        {
          src: data.src,
          author: '',
        },
      ];
      $q.bex.send('mount.iframe');
      $q.bex.send((payload as QuasarBEXPayload).eventResponseKey);
    });

    const handleDialogHide = () => {
      $q.bex.send('unmount.iframe');
    };
    return {
      confirm,
      images,
      handleDialogHide,
    };
  },
});
</script>
