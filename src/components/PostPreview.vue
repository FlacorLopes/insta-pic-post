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
        <q-card-section
          class="column items-center q-gutter-y-sm relative-position"
          id="imgList"
        >
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
          <q-inner-loading
            :showing="isLoading"
            label="Carregando imagem..."
            label-class="text-teal"
            label-style="font-size: 1.1em"
          />
        </q-card-section>
      </q-scroll-area>
    </q-card>
  </q-dialog>
</template>
<script lang="ts">
import { uid, useQuasar } from 'quasar';
import { defineComponent, nextTick, ref } from 'vue';

export type QuasarBEXPayload = {
  eventResponseKey: string;
} & Record<string, any>;

interface Image {
  id: string;
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
    const isLoading = ref(false);
    const images = ref<Image[]>([]);
    const isCopying = ref(false);
    const reader = new FileReader();

    $q.bex.on('open.preview', async (payload) => {
      const { data } = payload as QuasarBEXPayload;

      confirm.value = true;
      isLoading.value = true;
      $q.bex.send('mount.iframe');
      $q.bex.send((payload as QuasarBEXPayload).eventResponseKey);

      const response = await fetch(data.src);
      const blob = await response.blob();

      reader.readAsDataURL(blob);
      reader.onload = () => {
        images.value = [
          ...images.value,
          {
            src: <string>reader.result,
            author: data.author,
            id: uid(),
          },
        ];
        isLoading.value = false;
      };
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
      const response = await fetch(
        'https://instagram.fssa20-1.fna.fbcdn.net/v/t51.2885-15/287967397_1480351305758573_5455054683528624605_n.jpg?stp=dst-jpg_e35_p1080x1080&_nc_ht=instagram.fssa20-1.fna.fbcdn.net&_nc_cat=1&_nc_ohc=LJ8yLQBDyRsAX-dwNOi&edm=AJ9x6zYBAAAA&ccb=7-5&ig_cache_key=Mjg2MjI2NTQ1NDQ4ODkzMTEzMQ%3D%3D.2-ccb7-5&oh=00_AT-LihrBE1pqiGUVTh5NP7orHf-r89LsvWrpTcAamKpOBg&oe=62B274A2&_nc_sid=cff2a4'
      );
      const blob = await response.blob();

      console.log('o blobão', blob, images.value);

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
      isLoading,
      handleDialogHide,
      removeImage,
      copyContent,
      getImageAuthor,
    };
  },
});
</script>
