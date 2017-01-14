let {PropTypes: types} = React;

import NoteList from "st/note_list"
import ChordList from "st/chord_list"

import {parseNote, letterOffset, MIDDLE_C_PITCH} from "st/music"

export class NoteListRenderer {
  constructor() {
  }

  renderNotes(component) {
    const props = component.props
    let keySignatureWidth = 0

    if (props.keySignature) {
      let count = Math.abs(props.keySignature.count)
      keySignatureWidth = count > 0 ? count * 20 + 20 : 0;
    }

    return props.notes.map((note, idx) => {
      let opts = {
        goal: true,
        offset: keySignatureWidth + props.noteWidth * idx,
        first: idx == 0,
      }

      if (Array.isArray(note)) {
        opts.rowOffsets = {}

        let noteEls = note.map((sub_note, col_idx) => {
          opts.key = `${idx}-${col_idx}`
          return this.renderNote(component, sub_note, opts)
        })

        if (note.annotation) {
          let style = {
            top: `-66%`,
            left: `${opts.offset}px`
          }

          // TODO: this is being double rendered with two staves?
          noteEls.push(<div style={style} className="annotation">
            {note.annotation}
          </div>)
        }

        return noteEls
      } else {
        opts.key = idx
        return this.renderNote(component, note, opts)
      }
    });

  }

  renderHeldNote(component, note, opts={}) {
    return this.renderNote(component, note, Object.assign(opts, {
      classes: { held: true }
    }))
  }

  renderNote(component, note, opts={}) {
    const props = component.props
    let key = props.keySignature
    note = key.enharmonic(note)

    let pitch = parseNote(note)

    if (props.inGrand) {
      switch (props.staffClass) {
        case "f_staff":  // lower
          if (pitch >= MIDDLE_C_PITCH) {
            return;
          }
          break;
        case "g_staff":  // upper
          if (pitch < MIDDLE_C_PITCH) {
            return;
          }
          break;
      }
    }

    let row = letterOffset(pitch, !key.isFlat())
    let fromTop = letterOffset(props.upperLine) - row;
    let fromLeft = opts.offset || 0

    if (opts.rowOffsets) {
      let rowOffset = 1
      while (opts.rowOffsets[row - 1] == rowOffset || opts.rowOffsets[row + 1] == rowOffset) {
        rowOffset += 1
      }
      opts.rowOffsets[row] = rowOffset

      fromLeft += (rowOffset - 1) * 28
    }

    let style = {
      top: `${Math.floor(fromTop * 25/2)}%`,
      left: `${fromLeft}px`
    }

    let outside = pitch > props.upperLine || pitch < props.lowerLine;
    let accidentals = key.accidentalsForNote(note)

    let classes = classNames("whole_note", "note", {
      is_flat: accidentals == -1,
      is_sharp: accidentals == 1,
      is_natural: accidentals == 0,
      outside: outside,
      noteshake: props.noteShaking && opts.first,
      held: opts.goal && opts.first && props.heldNotes[note],
    }, opts.classes || {})

    let parts = [
      <img className="primary" src="/static/svg/noteheads.s0.svg" />
    ]

    if (accidentals == 0) {
      parts.push(<img className="accidental natural" src="/static/svg/natural.svg" />)
    }

    if (accidentals == -1) {
      parts.push(<img className="accidental flat" src="/static/svg/flat.svg" />)
    }

    if (accidentals == 1) {
      parts.push(<img className="accidental sharp" src="/static/svg/sharp.svg" />)
    }

    let noteEl = <div
      key={opts.key}
      style={style}
      data-note={note}
      data-midi-note={pitch}
      className={classes}
      children={parts}></div>

    if (outside) {
      return [
        noteEl,
        this.renderLedgerLines(component, note, opts),
      ];
    } else {
      return noteEl;
    }
  }

  renderLedgerLines(component, note, opts={}) {
    const props = component.props

    let key = props.keySignature
    let pitch = parseNote(note)
    let fromLeft =  opts.offset || 0
    let letterDelta = 0
    let below = false

    let offset = letterOffset(pitch, !key.isFlat())

    // above
    if (pitch > props.upperLine) {
      letterDelta = offset - letterOffset(props.upperLine);
    }

    // below
    if (pitch < props.lowerLine) {
      letterDelta = letterOffset(props.lowerLine) - offset;
      below = true;
    }

    let numLines = Math.floor(letterDelta / 2);

    let lines = [];
    for (let i = 0; i < numLines; i++) {
      let style = {
        left: `${(opts.offset || 0) - 10}px`,
        width: `${40 + 20}px`,
      }

      if (below) {
        style.top = `${100 + 25*(i + 1)}%`;
      } else {
        style.bottom = `${100 + 25*(i + 1)}%`;
      }

      lines.push(<div
        className={classNames("ledger_line", {
          above: !below,
          below: below
        })}
        style={style} />);
    }

    return lines;
  }
}

export class Staff extends React.Component {
  static propTypes = {
    // rendering props
    upperLine: types.number.isRequired,
    lowerLine: types.number.isRequired,
    cleffImage: types.string.isRequired,
    staffClass: types.string.isRequired,
    keySignature: types.object,

    // state props
    notes: types.array,
    heldNotes: types.object,
    inGrand: types.bool,
  }

  constructor(props) {
    super(props);
    this.noteRenderer = new NoteListRenderer()
  }

  // skips react for performance
  setOffset(amount) {
    this.refs.notes.style.transform = `translate3d(${amount}px, 0, 0)`;
  }

  render() {
    if (!(this.props.notes instanceof NoteList)) {
      return <div />
    }

    return <div className={classNames("staff", this.props.staffClass)}>
      <img className="cleff" src={this.props.cleffImage} />

      <div className="lines">
        <div className="line1 line"></div>
        <div className="line2 line"></div>
        <div className="line3 line"></div>
        <div className="line4 line"></div>
        <div className="line5 line"></div>
      </div>

      {this.renderKeySignature()}

      <div ref="notes" className="notes">
        {this.renderNotes()}
        {this.renderHeld()}
      </div>

    </div>;
  }

  renderHeld(notes) {
    // notes that are held down but aren't correct
    return Object.keys(this.props.heldNotes).map((note, idx) =>
      !this.props.notes.inHead(note) && this.noteRenderer.renderHeldNote(this, note, {
        key: `held-${idx}`,
      })
    );
  }

  renderKeySignature() {
    let keySignature = this.props.keySignature

    if (!keySignature) {
      return;
    }

    if (keySignature.count == 0) {
      return;
    }

    let ksCenter = parseNote(this.props.keySignatureCenter)
    if (keySignature.isFlat()) { ksCenter -= 2 }

    let sigNotes = keySignature.notesInRange(ksCenter - 10, ksCenter + 2)

    let topOffset = letterOffset(this.props.upperLine)

    let sigClass = keySignature.isFlat() ? "flat" : "sharp";

    let src = keySignature.isFlat() ? "/static/svg/flat.svg" : "/static/svg/sharp.svg";

    return <div className="key_signature">
      {sigNotes.map((n, i) => {
        let pitch = parseNote(n);
        let fromTop = topOffset - letterOffset(pitch);
        let style = {
          top: `${Math.floor(fromTop * 25/2)}%`,
          left: `${i * 20}px`
        }

        return <img
          key={`sig-${n}`}
          data-note={n}
          style={style}
          className={classNames("accidental", sigClass)}
          src={src} />;
      })}
    </div>;
  }

  renderNotes() {
    return this.noteRenderer.renderNotes(this)
  }
}

export class GStaff extends Staff {
  static defaultProps = {
    // where the key signature is centered around
    keySignatureCenter: "F6",
    upperLine: 77,
    lowerLine: 64,
    cleffImage: "/static/svg/clefs.G.svg",
    staffClass: "g_staff",
  }
}

export class FStaff extends Staff {
  static defaultProps = {
    keySignatureCenter: "F4",
    upperLine: 57,
    lowerLine: 57 - 13,
    cleffImage: "/static/svg/clefs.F_change.svg",
    staffClass: "f_staff",
  }
}

export class GrandStaff extends React.Component {
  // skips react for performance
  setOffset(amount) {
    if (!this.staves) {
      return;
    }

    this.staves.forEach(s => {
      if (s) {
        s.setOffset(amount)
      }
    })
  }

  render() {
    this.staves = []

    return <div className="grand_staff">
      <GStaff
        ref={(s) => this.staves.push(s)}
        inGrand={true}
        {...this.props} />
      <FStaff
        ref={(s) => this.staves.push(s)}
        inGrand={true}
        {...this.props} />
    </div>;
  }
}

export class ChordStaff extends React.Component {
  static propTypes = {
    chords: types.array,
  }

  setOffset(amount) {
    this.refs.chordScrolling.style.transform = `translate3d(${amount}px, 0, 0)`;
  }

  render() {
    if (!(this.props.chords instanceof ChordList)) {
      return <div />
    }

    let touchedNotes = Object.keys(this.props.touchedNotes)

    return <div className="chord_staff">
      <div className="chord_scrolling" ref="chordScrolling">
        {this.props.chords.map((c, i) => {
          let pressedIndicator

          if (i == 0 && touchedNotes.length) {
            pressedIndicator = <span className="touched">
              {touchedNotes.map(n => {
                if (c.containsNote(n)) {
                  return <span key={`right-${n}`} className="right">•</span>
                } else {
                  return <span key={`wrong-${n}`} className="wrong">×</span>
                }
              })}
            </span>
          }

          return <div key={`${c}-${i}`} className={classNames("chord", {
            errorshake: this.props.noteShaking && i == 0,
          })}>
            {c.toString()}
            {pressedIndicator}
          </div>
        })}
      </div>
    </div>
  }
}
