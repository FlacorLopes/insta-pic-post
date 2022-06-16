<template>
  <q-dialog v-model="confirm" @hide="handleDialogHide" full-height>
    <q-card style="width: 50vw">
      <div class="row justify-between items-center q-pr-sm">
        <q-card-actions align="left" class="row q-px-sm">
          <q-btn
            color="secondary"
            round
            icon="content_copy"
            @click="
              async () => {
                await copyContent();
              }
            "
          />
          <q-btn color="secondary" round icon="close" v-close-popup />
        </q-card-actions>

        <q-avatar>
          <a
            href="https://github.com/FlacorLopes/insta-pic-post"
            target="_blank"
            ><img
              src="github.png"
              alt="github mask"
              style="width: 32px; height: 32px"
          /></a>
        </q-avatar>
      </div>
      <q-separator />
      <q-scroll-area style="height: 80vh">
        <q-card-section class="column items-center q-gutter-y-sm" id="imgList">
          <div
            v-for="(image, index) in images"
            :key="image"
            style="width: 100%"
          >
            <q-img
              :src="image.src"
              alt="picture preview"
              class="rounded-borders"
              fit="fill"
            >
              <q-icon
                v-if="!isCopying"
                class="absolute all-pointer-events"
                size="32px"
                name="highlight_off"
                color="secondary"
                hidden
                style="top: 8px; right: 8px"
                @click="removeImage(index)"
              >
                <q-tooltip> Remover </q-tooltip>
              </q-icon>
            </q-img>
            <div class="text-center text-caption">
              <a :href="image.author">{{ getImageAuthor(image.author) }}</a>
            </div>
          </div>
        </q-card-section>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>
<script lang="ts">
import { useQuasar } from 'quasar';
import { defineComponent, nextTick, ref } from 'vue';

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
    const isCopying = ref(false);

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

    const askWriteClipboardPermission = async () => {
      try {
        const { state } = await navigator.permissions.query({
          name: 'clipboard-write',
        });

        return state === 'granted';
      } catch (error) {
        return false;
      }
    };

    const copyContent = async () => {
      const allowed = await askWriteClipboardPermission();
      if (!allowed) {
        $q.notify({
          type: 'warning',
          multiLine: true,
          message:
            'Por favor, dê permissão de escrita na área de transferência.',
          icon: 'no_photography',
        });

        return;
      }
      isCopying.value = true;

      await nextTick();
      const imgList = document.querySelector('#imgList');

      if (imgList) {
        try {
          const blob = new Blob([imgList.innerHTML], { type: 'text/html' });
          await navigator.clipboard.write([
            new ClipboardItem({ 'text/html': blob }),
          ]);
          $q.notify({
            type: 'positive',
            multiLine: true,
            message: 'Imagens copiadas :)',
            icon: 'content_copy',
          });
        } catch (error) {
          console.error(error);

          $q.notify({
            type: 'negative',
            message:
              'Ocorreu um erro ao copiar as imagens. Você ainda pode copiar manualmente o conteúdo :)',
            icon: 'no_photography',
          });
        } finally {
          isCopying.value = false;
        }
      }
    };

    const getImageAuthor = (url: string) =>
      new URL(url).pathname.replaceAll('/', '');
    return {
      confirm,
      images,
      isCopying,
      handleDialogHide,
      removeImage,
      copyContent,
      getImageAuthor,
    };
  },
});
</script>
