// Storybook story para ImageCropper. Requer @storybook/react instalado.
// Se o pacote não estiver presente no workspace ainda, instale antes de usar:
// pnpm add -D @storybook/react @storybook/addon-essentials @storybook/addon-interactions
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { ImageCropper, type ImageCropperProps } from '../ImageCropper';

const meta: Meta<typeof ImageCropper> = {
  title: 'Image/Cropper/Base',
  component: ImageCropper,
  args: {
    aspect: 1,
    round: true,
  },
};
export default meta;

type Story = StoryObj<typeof ImageCropper>;

const SAMPLE = 'https://via.placeholder.com/800x600.png?text=Demo+Image';

function RoundAvatarTemplate(args: ImageCropperProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  return (
    <div className="h-96 w-full max-w-lg">
      <ImageCropper
        {...args}
        image={SAMPLE}
        crop={crop}
        zoom={zoom}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={() => {}}
      />
    </div>
  );
}

export const RoundAvatar: Story = { render: (args: ImageCropperProps) => <RoundAvatarTemplate {...args} /> };

function RectTemplate(args: ImageCropperProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  return (
    <div className="h-96 w-full max-w-3xl">
      <ImageCropper
        {...args}
        image={SAMPLE}
        crop={crop}
        zoom={zoom}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={() => {}}
      />
    </div>
  );
}

export const Rectangular: Story = {
  args: { round: false, aspect: 16 / 9 },
  render: (args: ImageCropperProps) => <RectTemplate {...args} />,
};
