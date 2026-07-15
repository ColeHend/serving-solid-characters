import { Component, createEffect, createMemo, createSignal, runWithOwner, Show } from "solid-js";
import { Button, Icon, Input, Modal, Select, Option } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import { Add } from "coles-solid-library/icons";
import { SessionTimePill } from "./sessionTimePill";
import styles from './dmHeader.module.scss';
import { getScreenSize } from "../../../shared/customHooks/utility/tools/getScreenSize";

interface DmHeaderProps {
    campaign: string | undefined;
    session: string | undefined;
    onCampaignChange: (value: string) => void;
    onSessionChange: (value: string) => void;
}

export const DmHeader: Component<DmHeaderProps> = (props) => {
    const [showSessionSettings, setShowSessionSettings] = createSignal<boolean>(false);
    const [sessionModal, setSessionModal] = createSignal<Element>();

    const { screenSize } = getScreenSize({ medium: 1268 });
    const isMobile = createMemo(() => ['small', 'medium'].includes(screenSize()));

    createEffect(() => {
        const modal = sessionModal();
        if (modal) {
            modal.classList.add(`${styles.modal}`);
        }
    });

    return <div class={styles.header}>
        <Show when={!isMobile()}>
            <h1 class={styles.wordmark}>DM Command</h1>
        </Show>
        <Show when={isMobile()}>
            <div class={styles.mobileTitle}>
                <h1 class={styles.wordmark}>DM Command</h1>
                <SessionTimePill />
            </div>
        </Show>
        <span class={styles.selects}>
            <Select
                placeholder="Select Campaign..."
                value={props.campaign}
                onChange={(v) => runWithOwner(null, () => props.onCampaignChange(v))}>
                <Option value="">None</Option>
            </Select>
            
            <Show when={!isMobile()}>
                <Select
                    placeholder="Select Session..."
                    value={props.session}
                    onChange={(v) => runWithOwner(null, () => props.onSessionChange(v))}>
                    <Option value="">None</Option>
                </Select>
            </Show>
            <Show when={isMobile()}>
                <div class={styles.mobileTitle}>
                    <Select
                    placeholder="Select Session..."
                    value={props.session}
                    onChange={(v) => runWithOwner(null, () => props.onSessionChange(v))}>
                        <Option value="">None</Option>
                    </Select>
                    <Button transparent class={`${styles.addSession} ${styles.buttonPad}`} onClick={() => setShowSessionSettings(true)}>
                        <span class={styles.addSessionInner}><Icon icon={Add} /> Session</span>
                    </Button>
                </div>
            </Show>
        </span>
        <Show when={!isMobile()}>
            <Button transparent class={styles.addSession} onClick={() => setShowSessionSettings(true)}>
                <span class={styles.addSessionInner}><Icon icon={Add} /> Session</span>
            </Button>
        </Show>
        <span class={styles.spacer} />
        <Show when={!isMobile()}>
            <SessionTimePill />
        </Show>
        <Modal
            title="Add Session"
            show={[showSessionSettings, setShowSessionSettings]}
            width={isMobile() ? '' : '22vw'}
            height={'30vh'}
            ref={setSessionModal}>
            <div class={styles.modalBody}>
                <Input placeholder="Session name" />
                <span class={styles.modalHint}>Sessions will link this screen to a campaign log.</span>
                <Button onClick={() => setShowSessionSettings(false)}>Create</Button>
            </div>
        </Modal>
    </div>;
};
