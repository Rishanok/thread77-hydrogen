import {useEffect, useId, useRef} from 'react';

export function SizeGuideModal({
  isOpen,
  onClose,
  productTitle,
  guide,
}: {
  isOpen: boolean;
  onClose: () => void;
  productTitle?: string;
  guide?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (isOpen && guide) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen, guide]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={onClose}
    >
      <h2 id={titleId}>{productTitle} size guide</h2>
      <p style={{whiteSpace: 'pre-line'}}>{guide}</p>
      <button type="button" onClick={onClose}>
        Close size guide
      </button>
    </dialog>
  );
}
