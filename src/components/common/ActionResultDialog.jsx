import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Dialog } from "primereact/dialog";

const ActionResultDialog = ({ visible, onClose, success, message }) => {
  useEffect(() => {
    if (visible && success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visible, success, onClose]);

  const headerTemplate = (
    <div style={{ display: "flex", alignItems: "center" }}>
      <span>{success ? "Éxito" : "Error"}</span>
    </div>
  );

  return (
    <Dialog
      header={headerTemplate}
      visible={visible}
      onHide={onClose}
      modal
      draggable={false}
      resizable={false}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <i
          className={`pi ${success ? "pi-check-circle" : "pi-times-circle"}`}
          style={{
            fontSize: "2rem",
            color: success ? "green" : "red",
            marginRight: "0.5rem",
          }}
        />
        <span>{message}</span>
        {success && (
          <i
            className="pi pi-spinner pi-spin"
            style={{ fontSize: "2rem", marginLeft: "1rem" }}
          />
        )}
      </div>
    </Dialog>
  );
};

ActionResultDialog.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  success: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
};

export default ActionResultDialog;
