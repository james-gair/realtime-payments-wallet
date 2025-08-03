import type { ErrorModalProps } from "../types";
import { Modal } from "./Modal";

export function ErrorModal({ errorMessage, onClose }: ErrorModalProps) {
  return (
    <Modal modalName="Error" displayMessage={errorMessage} onClose={onClose} />
  );
}
