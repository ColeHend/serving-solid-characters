import { Component } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { CloudSync } from "coles-solid-library/icons";
import { srdUpdating, updateSrdData } from "../../pwa/offline/srdVersion";

/**
 * Navbar action shown only while the server's SRD data is newer than this client's cache
 * (see srdVersion.checkSrdFreshness). Clicking re-pulls every SRD dataset into IndexedDB;
 * on success the version is recorded and the button disappears.
 */
const UpdateSrdNavButton: Component = () => {
    return (
        <Button
            transparent
            title="Update SRD data"
            disabled={srdUpdating()}
            onClick={() => void updateSrdData()}>
            <Icon icon={CloudSync} size="large" />
        </Button>
    );
};

export default UpdateSrdNavButton;
