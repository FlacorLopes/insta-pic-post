<template>
  <q-dialog v-model="confirm" persistent @hide="handleDialogHide">
    <q-card style="width: 500px; max-width: 80vw">
      <q-card-section class="column items-center q-gutter-y-sm">
        <div
          v-for="(image, index) in images"
          :key="image.src"
          style="width: 400px"
        >
          <q-img
            :src="image.src"
            alt="picture preview"
            class="rounded-borders"
            fit="fill"
          >
            <q-icon
              class="absolute all-pointer-events"
              size="32px"
              name="highlight_off"
              color="black"
              style="top: 8px; right: 8px"
              @click="removeImage(index)"
            >
              <q-tooltip> Remover </q-tooltip>
            </q-icon>
          </q-img>
          <div class="text-center text-caption">{{ image.author }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Fechar" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script lang="ts">
import { useQuasar } from 'quasar';
import { defineComponent, ref } from 'vue';

export type QuasarBEXPayload = {
  eventResponseKey: string;
} & Record<string, any>;

interface Image {
  id: number;
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

      confirm.value = true;
      images.value = [
        ...images.value,
        {
          src: data.src,
          author: data.author,
          id: Date.now(),
        },
      ];
      $q.bex.send('mount.iframe');
      $q.bex.send((payload as QuasarBEXPayload).eventResponseKey);
    });
    $q.bex.on('error.fired', (payload) => {
      const { data } = payload as QuasarBEXPayload;

      $q.bex.send('mount.iframe').then(() => {
        $q.notify({
          type: 'warning',
          multiLine: true,
          message: `Ocorreu um erro: ${data.code}`,
          icon: 'no_photography',
          onDismiss: async () => await closeModal(),
        });
        $q.bex.send((payload as QuasarBEXPayload).eventResponseKey);
      });
    });

    const closeModal = () => $q.bex.send('unmount.iframe');
    const handleDialogHide = () => {
      closeModal();
    };

    const removeImage = (index: number) => {
      images.value.splice(index, 1);

      if (images.value.length == 0) closeModal();
    };
    return {
      confirm,
      images,
      handleDialogHide,
      removeImage,
    };
  },
});
</script>
