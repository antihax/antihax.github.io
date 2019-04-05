if (!window) {
  // Only included for VS Code Intellisense
  function require() { }
  const
    React = require("react"),
    ReactDOM = require("react-dom"),
    L = require("leaflet")
}

// possibilities are a list of all known commands and their parameters
const possibilities = config.Suggestions

const icon = (type, subtype, color) => L.icon({
  iconUrl: `${type}/${subtype}/${color}.png`,
  iconSize: [24, 24], // size of the icon
  iconAnchor: [12, 12], // point of the icon which will correspond to marker's location
  popupAnchor: [-4, -24] // point from which the popup should open relative to the iconAnchor
})

const subtypes = (
  "None Raft Dingy Sloop Schooner Brigantine Galleon"
).split(" ")

const colors = (
  "red green yellow blue orange purple cyan magenta lime pink teal lavender brown beige maroon olive coral navy"
).split(" ")

const reservedColors = (
  "black grey"
).split(" ")

const allColors = [...colors, ...reservedColors]

const icons = {
  Bed: {
    None: {}
  },
  Ship: {
    None: {}
  }
}

allColors.forEach(color => {
  icons["Bed"]["None"][color] = icon("bed", "None", color)
})

subtypes.forEach(subtype => {
  icons["Ship"][subtype] = {}
  allColors.forEach(color => {
    icons["Ship"][subtype][color] = icon("ship", subtype, color)
  })
})

class EntityMarker extends React.Component {
  constructor(props) {
    super(props)
    this.add = this.add.bind(this)
    this.del = this.del.bind(this)
  }

  componentDidMount() {
    this.add()
  }
  componentDidUpdate() {
    this.del()
    this.add()
  }
  componentWillUnmount() {
    this.del()
  }
  render() {
    return null
  }

  add() {
    this.marker = createEntityMarker(this.props.info, this.props.map)
    this.marker.on("popupopen", this.props.onPopupOpen)
    this.marker.on("popupclose", this.props.onPopupClose)
  }

  del() {
    if (!this.marker)
      return

    this.marker.off("popupopen", this.props.onPopupOpen)
    this.marker.off("popupclose", this.props.onPopupClose)
    this.marker.remove()
    delete this.marker
  }
}

class CommandMarker extends React.Component {
  componentDidMount() {
    const { map, latlng, onClose } = this.props

    this.marker =
      L.marker(latlng).addTo(map)
        //.bindPopup("Enter command")
        .openPopup()
        .on("popupclose", onClose)

    // const [srv, x, y] = calcServerLocation(e.latlng)
    // console.log(`${srv}::${x},${y}::`)
    // document.getElementById("cmd").update(`${srv}::${x},${y}::`, true)
  }

  componentDidUpdate() {
    this.marker.setLatLng(this.props.latlng)
  }

  componentWillUnmount() {
    this.props.map.removeLayer(this.marker)
  }

  render() { return null }
}

class ShipPath extends React.Component {
  constructor(props) {
    super(props)
    this.add = this.add.bind(this)
  }

  componentDidMount() {
    this.add()
  }

  componentDidUpdate() {
    if (this.line)
      this.props.map.removeLayer(this.line)
    this.add()
  }

  componentWillUnmount() {
    if (this.line)
      this.props.map.removeLayer(this.line)
  }

  render() { return null }

  add() {
    const { color = "red", map, path } = this.props

    if (!path || path.length < 2)
      return
  }
}

class WorldMap extends React.Component {

  constructor(props) {
    super(props)
    this.forceTileReload = this.forceTileReload.bind(this)
  }

  forceTileReload() {
    console.log("forceTileReload!")

    fetch("territoryURL")
      .then(res => res.json())
      .then(config => {
        if (config.url) {
          if (this.territoryLayer) {
            this.worldMap.removeLayer(this.territoryLayer)
            delete this.territoryLayer
          }

          this.territoryLayer = L.tileLayer(config.url + "{z}/{x}/{y}.png?t={cachebuster}", {
            maxZoom: 6,
            minZoom: 1,
            bounds: L.latLngBounds([0,0],[-256,256]),
            noWrap: true,
            cachebuster: function() { return Math.random(); }
          })

          this.territoryLayer.addTo(this.worldMap)
        } else {
          console.error("Did not receive territory URL")
        }
      })
      .catch((err) => {
        console.error(err)
        this.setState({
          notification: {
            type: "error",
            msg: "Failed to get territory URL from server",
          }
        })
      })
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidMount() {

    this.forceTileReload()
    this.timer = setInterval(this.forceTileReload, 15000)

    const baseLayer = L.tileLayer("tiles/{z}/{x}/{y}.png", {
      maxZoom: 6,
      minZoom: 1,
      bounds: L.latLngBounds([0,0],[-256,256]),
      noWrap: true,
    })

    const map = this.worldMap = L.map("worldmap", {
      crs: L.CRS.Simple,
      layers: [baseLayer],
      zoomControl: false,
     
    })

    map.entities = {}
    map.entities.Bed = L.layerGroup()
    map.entities.Ship = L.layerGroup().addTo(map)

    L.control.zoom({
      position:'topright'
    }).addTo(map);
    

    map.setView([-128, 128], 2)

    if (this.props.onContextMenu)
      map.on("contextmenu.show", this.props.onContextMenu)
    if (this.props.onContextMenuClose)
      map.on("contextmenu.hide", this.props.onContextMenuClose)

    map.on("zoomend", () => {
        if (map.hasLayer(map.entities.Bed))
          map.removeLayer(map.entities.Bed)
    })
  }

  render() {
    const { entities, commandMarker, shipPath, color, onCancelCommand } = this.props

    return (
      <div id="worldmap">
        {Object.keys(entities).map(id => {
          let info = entities[id]
          if (info.ParentEntityID > 0) {
            info = Object.assign({}, info) // copy
            info.ServerXRelativeLocation += entities[info.ParentEntityID].ServerXRelativeLocation
            info.ServerYRelativeLocation += entities[info.ParentEntityID].ServerYRelativeLocation
          }

          return (
            <EntityMarker
              key={info.EntityID}
              info={info}
              map={this.worldMap}
              onPopupOpen={this.props.onPopupOpen}
              onPopupClose={this.props.onPopupClose}
            />
          )
        })
        }
        {commandMarker &&
          <CommandMarker map={this.worldMap} latlng={commandMarker} onClose={onCancelCommand} />
        }
        {shipPath &&
          <ShipPath map={this.worldMap} path={shipPath} color={color} />
        }
      </div>
    )
  }
}

function serverIDparts(serverID) {
  const buf = new ArrayBuffer(4)
  const srv = new DataView(buf)
  const littleEndian = true
  srv.setUint32(0, serverID, littleEndian)

  return [
    srv.getUint16(0, littleEndian),
    srv.getUint16(2, littleEndian),
  ]
}

function calcLatLng(info) {
  const serverX = 256 / config.ServersX
  const serverY = 256 / config.ServersY
  const offset = {
    x: info.ServerID[1] * serverX,
    y: info.ServerID[0] * serverY,
  }

  return [
    -(serverY * info["ServerYRelativeLocation"] + offset.y),
    +(serverX * info["ServerXRelativeLocation"] + offset.x),
  ]
}

function convertToLatLng(cmd) {
  const parts = splitCommand(cmd)
  const info = {
    ServerID: serverIDparts(parts.server),
    ServerXRelativeLocation: parts.coords[0],
    ServerYRelativeLocation: parts.coords[1],
  }
  return calcLatLng(info)
}

function calcServerLocation(latlng) {
  if (latlng.lat > 0 || latlng.lng < 0)
    return

  const ServerX = 256 / config.ServersX
  const ServerY = 256 / config.ServersY

  const serverID = {
    x: Math.floor(latlng.lng / ServerX),
    y: Math.floor(-1 * latlng.lat / ServerY)
  }

  const buf = new ArrayBuffer(4)
  const srv = new DataView(buf)
  const littleEndian = true

  srv.setUint16(0, serverID.y, littleEndian)
  srv.setUint16(2, serverID.x, littleEndian)

  return [
    srv.getUint32(0, littleEndian),
    ((+1 * latlng.lng) % ServerX) / ServerX,
    ((-1 * latlng.lat) % ServerY) / ServerY,
  ]
}

function locationAsString(srvloc) {
  if (!srvloc)
    return ""

  if (!!srvloc.server)
    return `${srvloc.server}::${srvloc.coords[0]},${srvloc.coords[1]}::`

  if (srvloc.length >= 3)
    return `${srvloc[0]}::${srvloc[1]},${srvloc[2]}::`

  return ""
}

function isTribeID(tribeID) {
  return tribeID > 1000000000 + 50000
}

function getTribeColor(tribeID) {
  if (!tribeID)
    return "black"
  if (!isTribeID(tribeID))
    return "grey"

  var idx = tribeID % colors.length
  return colors[idx]
}

function createEntityMarker(info, map) {
  if (!icons[info.EntityType])
    return null
  if (!icons[info.EntityType][info.EntitySubType])
    info.EntitySubType = "None"

  const latlng = calcLatLng(info)
  const tribeColor = getTribeColor(info.TribeID)

  const options = {
    icon: icons[info.EntityType][info.EntitySubType][tribeColor],
    title: info.EntityName,
  }

  var infoPanel;
  if (info.EntitySubType != "None")
  {
    infoPanel = 
      `<strong>${info.EntityName}</strong><br>
      ${info.EntityType} - ${info.EntitySubType}</br>
      ${info.EntityID ? "EntityID " + info.EntityID : ""}</br>
      ${info.TribeID ? "TribeID " + info.TribeID : ""}
      <p>[${latlng[0]}, ${latlng[1]}]</p>`
  }
  else
  {
    infoPanel =
      `<strong>${info.EntityName}</strong><br>
      ${info.EntityType}</br>
      ${info.EntityID ? "EntityID " + info.EntityID : ""}</br>
      ${info.TribeID ? "TribeID " + info.TribeID : ""}
      <p>[${latlng[0]}, ${latlng[1]}]</p>`
  }
 
  const  marker=
      L.marker(latlng, options)
        .bindPopup(infoPanel)

  marker.addTo(map.entities[info.EntityType])
  marker.remove = function () {
    map.entities[info.EntityType].removeLayer(marker)
  }

  marker.map = map
  marker.entityInfo = info
  marker.tribeColor = tribeColor
  return marker
}

function splitCommand(text) {
  const parts = text.split("::")

  switch (parts.length) {
    case 4:
      return {
        server: parts[1],
        coords: parts[2].split(","),
        command: parts[3],
      }

    case 1:
      return { command: parts[0] }

    case 0:
      return { command: "" }
  }

  console.error("splitCommand: failed to parse:", { text })
  return { command: "" }
}

class CommandBar extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      buffer: "",
      historyIndex: -1,
    }

    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  componentDidUpdate() {
    if (this.props.focused)
      this.input.focus()
  }

  render() {
    return (
      <input
        id="cmd"
        className="CommandBar"
        ref={el => this.input = el}
        value={this.props.text}
        placeholder={this.props.focused
          ? "Enter Command (UP and DOWN for history. Hold SHIFT to maintain location. ESCAPE to clear text. ENTER to submit.)"
          : "Command Console"
        }
        onChange={(e) => this.props.onChange(e.target.value)}
        onKeyDown={this.handleKeyDown}
        disabled={this.props.disabled}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
      />
    )
  }

  handleKeyDown(event) {
    const { history, text } = this.props
    const { buffer, historyIndex } = this.state
    const { onChange, onSubmit } = this.props

    const next = (key, shiftPressed) => {
      if (historyIndex + 1 >= history.length)
        return

      event.preventDefault()

      const buf = historyIndex < 0 ? text : buffer

      this.setState({
        buffer: buf,
        historyIndex: historyIndex + 1,
      }, () => {
        const hist = history[(history.length - 1) - (historyIndex + 1)]
        if (!shiftPressed) {
          onChange(hist, key)
        } else {
          const loc = locationAsString(splitCommand(text))
          const cmd = splitCommand(hist).command
          onChange(loc + cmd, key)
        }
      })
    }

    const prev = (key, shiftPressed) => {
      if (historyIndex < 0)
        return

      const txt =
        historyIndex == 0
          ? buffer
          : history[(history.length - 1) - (historyIndex - 1)]

      this.setState({
        historyIndex: historyIndex - 1,
      }, () => {
        if (historyIndex == 0) {
          onChange(buffer, key)
        } else {
          const hist = history[(history.length - 1) - (historyIndex - 1)]
          if (!shiftPressed) {
            onChange(hist, key)
          } else {
            const loc = locationAsString(splitCommand(text))
            const cmd = splitCommand(hist).command
            onChange(loc + cmd, key)
          }
        }
      })
    }

    switch (event.key) {
      case "Tab":
        event.preventDefault()
        if (event.shiftKey)
          prev(event.key, true)
        else
          next(event.key, true)
        return

      case "ArrowUp":
        return next(event.key, event.shiftKey)

      case "ArrowDown":
        return prev(event.key, event.shiftKey)

      case "Enter":
        onSubmit(text)
          .then(() => {
            this.setState({
              historyIndex: -1,
            }, () => {
              onChange("")
            })
          })
          .catch(() => {
            onChange(text)
          })
        return

      case "Escape":
        this.setState({
          historyIndex: -1,
        }, () => {
          onChange("")
        })
        return

      case "Shift":
        return
    }

    this.setState({ historyIndex: -1 })
  }
}

const listItem = (className) => (content, key) => (
  <li className={className} key={key}>{content}</li>
)

function History(props) {
  const classes = ["History", !props.visible ? "hidden" : ""]

  if (props.history.length == 0)
    return (
      <div className={classes.join(" ")}>
        <em>No history.</em>
      </div>
    )

  return (
    <ol className={classes.join(" ")}>
      {props.history.map(listItem("cmd"))}
    </ol>
  )
}

function suggest(possibilities, text) {
  const cmd = splitCommand(text).command
  const args = cmd.split(" ")

  if (cmd.length === 0)
    return []

  const op = args[0].toLowerCase()
  return possibilities
    .map(p => [p.split(" ")[0].toLowerCase(), p])
    .filter(([cmd, p]) => cmd.startsWith(op))
    .sort((a, b) => a[0].length < b[0].length)
    .map(x => x[1])
}

function Suggestions(props) {
  // const classes = ["History", !props.visible ? "hidden" : ""]
  const classes = ["Suggestions"]

  return props.suggestions.length === 0
    ? (
      <div className={classes.join(" ")}>
        <em>No matches.</em>
      </div>
    )
    : (
      <ol reversed className={classes.join(" ")}>
        {props.suggestions.map(listItem("suggestion"))}
      </ol>
    )
}

class CommandConsole extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      history: [],
      suggestions: [],
      historyOpen: false,
      sending: false,
    }

    this.handleCommandBarChange = this.handleCommandBarChange.bind(this)
    this.handleCommandBarSubmit = this.handleCommandBarSubmit.bind(this)
  }

  render() {
    const { history, historyOpen, sending, suggestions } = this.state

    const showHistory =
      historyOpen || splitCommand(this.props.text).command.length === 0

    return (
      <div id="cmdbar" className="CommandConsole">
        {showHistory ?
          <History
            visible={this.props.focused}
            history={history}
          />
          :
          <Suggestions
            visible={this.props.focused}
            suggestions={suggestions}
          />
        }
        <CommandBar
          text={this.props.text || ""}
          history={showHistory ? history : suggestions.map(s => s.split(" ")[0])}
          autocomplete={!showHistory}
          disabled={sending}
          focused={this.props.focused}
          onBlur={this.props.onBlur}
          onChange={this.handleCommandBarChange}
          onFocus={this.props.onFocus}
          onSubmit={this.handleCommandBarSubmit}
        />
      </div>
    )
  }

  handleCommandBarChange(text, keyPressed) {
    switch (keyPressed) {
      case "ArrowUp":
      case "ArrowDown":
      case "Tab":
        const historyOpen =
          this.state.historyOpen || splitCommand(this.props.text).command.length === 0

        this.props.onChange(text)
        this.setState({ historyOpen })
        return
    }

    this.setState({
      historyOpen: false,
      suggestions: suggest(possibilities, text)
    }, () => {
      this.props.onChange(text)
    })
  }

  handleCommandBarSubmit(cmd) {
    const { history } = this.state

    this.setState({ sending: true })

    return this.props.onSubmit(cmd)
      .then(() => {
        this.setState({
          sending: false,
          history: [...history, cmd],
        })
      }, () => {
        this.setState({ sending: false })
      })
  }
}


class TitleBar extends React.Component {
  render() {
    return (
      <div className="titlebar" id="TitleBar"><img src="atlaslogo128.png" className="atlastitlebaricon" /></div>
    )
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      notification: {},
      entities: {},
      tribes: {},
      command: "",
      commandMarker: null,
      shipPath: [],
      activeTribeColor: "",
      consoleFocused: false,
      sending: false,
      commandConsoleEnabled: false
    }

 
    this.checkCommandConsoleEnabled = this.checkCommandConsoleEnabled.bind(this);

    this.handleWorldMapCancelCommand = this.handleWorldMapCancelCommand.bind(this)
    this.handleWorldMapContextMenu = this.handleWorldMapContextMenu.bind(this)
    this.handleWorldMapContextMenuClose = this.handleWorldMapContextMenuClose.bind(this)
    this.handleServerCommand = this.handleServerCommand.bind(this)

    this.handleWorldMapPopupClose = this.handleWorldMapPopupClose.bind(this)
    this.handleWorldMapPopupOpen = this.handleWorldMapPopupOpen.bind(this)

    this.handleCommandConsoleChange = this.handleCommandConsoleChange.bind(this)
    this.handleCommandConsoleSubmit = this.handleCommandConsoleSubmit.bind(this)
    this.handleCommandConsoleBlur = this.handleCommandConsoleBlur.bind(this)
    this.handleCommandConsoleFocus = this.handleCommandConsoleFocus.bind(this)
  }

  componentDidMount() {
    if (window) {
      window.onkeydown = (evt) => {
        if (evt.key !== '`')
          return

        if (this.state.consoleFocused)
          return

        evt.preventDefault()
        this.setState({ consoleFocused: true })
      }
    }


    this.checkCommandConsoleEnabled()
  }



  render() {
    const {
      activeTribeColor, shipPath,
      command, commandMarker, consoleFocused, entities,
      notification, tribes,  commandConsoleEnabled,
    } = this.state

    let CommandConsoleComponent;
    if (commandConsoleEnabled) {
      CommandConsoleComponent = <CommandConsole
          text={command}
          focused={consoleFocused}
          onChange={this.handleCommandConsoleChange}
          onSubmit={this.handleCommandConsoleSubmit}
          onBlur={this.handleCommandConsoleBlur}
          onFocus={this.handleCommandConsoleFocus}
        />;
    } else {
      CommandConsoleComponent = null
    }

    return (
      <div className="App">
        <TitleBar />
        <WorldMap
          entities={entities}
          commandMarker={commandMarker}
          shipPath={shipPath}
          color={activeTribeColor}
          onContextMenu={this.handleWorldMapContextMenu}
          onContextMenuClose={this.handleWorldMapContextMenuClose}
          onServerCommand={this.handleServerCommand}
          onCancelCommand={this.handleWorldMapCancelCommand}
          onPopupOpen={this.handleWorldMapPopupOpen}
          onPopupClose={this.handleWorldMapPopupClose}
        />
        <div className={"notification " + (notification.type || "hidden")}>
          {notification.msg}
          <button className="close" onClick={() => this.setState({ notification: {} })}>Dismiss</button>
        </div>
        {CommandConsoleComponent}
  
      </div>
    )
  }

  

  checkCommandConsoleEnabled() {
    fetch("command", { method: "POST", body: ""})
      .then(res => { 
        console.log(res);
        if (res.status == 405) {
          this.setState({commandConsoleEnabled: false});
        } else {
          this.setState({commandConsoleEnabled: true});
        }
      });
  }

 

  handleCommandConsoleChange(command) {
    let commandMarker = null
    if (command.indexOf("::") !== -1)
      commandMarker = convertToLatLng(command)

    this.setState({
      command,
      commandMarker,
    })
  }

  handleCommandConsoleBlur() {
    this.setState({ consoleFocused: false })
  }

  handleCommandConsoleFocus() {
    this.setState({ consoleFocused: true })
  }

  handleCommandConsoleSubmit(cmd) {
    this.setState({
      sending: true,
      notification: {
        type: "info",
        msg: "Sending...",
      }
    })

    return fetch("command", {
      method: "POST",
      body: cmd,
    })
      .then(res => {
        if (!res.ok) {
          this.setState({
            sending: false,
            notification: {
              type: "error",
              msg: "Failed to execute command",
            },
          })
          throw res
        }

        this.setState({
          sending: false,
          commandMarker: null,
          notification: {},
          history: [...history, cmd],
        })
      })
  }

  handleWorldMapCancelCommand() {
    this.setState({ commandMarker: null })
  }

  handleWorldMapContextMenu(evt) {
    const srvloc = calcServerLocation(evt.latlng)
    const loc = locationAsString(srvloc)
    const text = splitCommand(this.state.command).command

    this.setState({
      command: "Map::" + loc + text,
      commandMarker: evt.latlng,
      consoleFocused: true,
    })
  }

  handleWorldMapContextMenuClose(evt) {
    this.setState({commandMarker: null});
  }

  handleServerCommand(evt,cmd,bAutoSubmit) {
    const srvloc = calcServerLocation(evt.latlng)
    const loc = locationAsString(srvloc)
    
    let text = splitCommand(this.state.command).command
    if (cmd)
      text = cmd

    if (bAutoSubmit) {
      this.handleCommandConsoleSubmit("Map::" + loc + text)
      this.setState({
        command: "",
        commandMarker: null,
        consoleFocused: false,
      })
    } else {
      this.setState({
        command: "Map::" + loc + text,
        commandMarker: evt.latlng,
        consoleFocused: true,
      })
    }
  
  }

  handleWorldMapPopupClose(evt) {
    if (!evt || !evt.sourceTarget)
      return

    const info = evt.sourceTarget.entityInfo

    if (!info || info.EntityType !== "Ship")
      return

    this.setState({ shipPath: [] })
  }

  handleWorldMapPopupOpen(evt) {
    if (!evt || !evt.sourceTarget)
      return

    const info = evt.sourceTarget.entityInfo

    if (!info || info.EntityType !== "Ship" || !info.EntityID)
      return

    fetch(`travels?id=${info.EntityID}`)
      .then(res => res.json())
      .then(shipPath => this.setState({
        shipPath,
        activeTribeColor: getTribeColor(info.TribeID),
      }, () => {
        // HACK: for some reason the popup closes after setState, so force it to reopen
        evt.popup.openOn(evt.sourceTarget.map)
      }))
  }
}

ReactDOM.render(
  <App refresh={5 * 1000 /* 5 seconds */} />,
  document.getElementById("app")
)
