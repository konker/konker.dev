// @refresh reload
import { mount, StartClient } from '@solidjs/start/client';

const client = mount(() => <StartClient />, document.getElementById('app')!);

export default client;
