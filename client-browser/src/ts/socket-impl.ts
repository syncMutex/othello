export class Socket{
  private conn:WebSocket|null = null;
  private eventMap:{
    [k:string]: (_:any) => void
  } = {};
  private queuedEmitsBeforeConn:{evName:string,data:any}[] = [];

  onClose(cb:() => void) {
    const closeEventCb = () => {
      cb();
      this.conn?.removeEventListener("close", closeEventCb)
    }
    this.conn?.addEventListener("close", closeEventCb)
  }

  async connect(url:string, onerror:(e:Event) => void) {
    this.conn = new WebSocket(url);
    this.conn.onerror = onerror;
    this.conn.addEventListener("message", (e:MessageEvent) => {
      const msg:{ name:string, data:string } = JSON.parse(e.data);
      if(!(msg.name in this.eventMap)) return; 
      try{
        const json = JSON.parse(msg.data);
        this.eventMap[msg.name](json);
      } catch(err) {
        this.eventMap[msg.name](msg.data);
      }
    })
    await (new Promise<void>((resolve) => {
      this.conn?.addEventListener("open", () => {
        resolve();
      })
    }))
    this.queuedEmitsBeforeConn.forEach(({ evName, data }) => this.emit(evName, data))
    this.queuedEmitsBeforeConn = [];
  }

  private queueEmitBeforeConn(evName:string, data:any="") {
    this.queuedEmitsBeforeConn.push({ evName, data });
  }

  get isConnected() {
    return this.conn && (this.conn.readyState === this.conn.OPEN);
  }

  on(evName:string, cb:(_:any) => void) {
    this.eventMap[evName] = cb;
  }

  emit(evName:string, data:any="") {
    if(this.conn?.readyState === this.conn?.CONNECTING) return this.queueEmitBeforeConn(evName, data);
    try{
      data = JSON.stringify(data);
    } catch(_) {}
    const res:string = JSON.stringify({
      name: evName,
      data
    })
    this.conn?.send(res)
  }
}

