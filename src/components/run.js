import { define } from '../utils/object'
import { toInt, isNumber } from '../utils/unit'

export default function (Glide, Components, Events) {
  const Run = {
    /**
     * Initializes autorunning of the glide.
     *
     * @return {Void}
     */
    mount () {
      this._o = false
    },

    /**
     * Makes glides running based on the passed moving schema.
     *
     * @param {String} move
     */
    make (move) {
      if (!Glide.disabled) {
        Glide.disable()

        this.move = move

        Events.emit('run.before', this.move)

        this.calculate()

        Events.emit('run', this.move)

        Components.Transition.after(() => {
          if (this.isOffset('<') || this.isOffset('>')) {
            this._o = false

            Events.emit('run.offset', this.move)
          }

          Events.emit('run.after', this.move)

          Glide.enable()
        })
      }
    },

    getRealLength () {
      let length = Components.Html.slides.length - Glide.settings.perView

      if(length < 0) {
        length = Components.Html.slides.length - 1;
      }

      return length;
    },

    getLeftCalculation (num) {
      let prevIndex = Glide.index - num
      let offset = false

      if(Glide.isType('slider')) {
        if(Components.Html.slides.length < Glide.settings.perView) {
          return {
            index: Glide.index,
            event: false,
            offset: false
          };
        } else if(prevIndex < 0) {
          return {
            index: Components.Html.slides.length - Glide.settings.perView,
            event: 'run.end',
            offset: true
          }
        }
      }

      if(prevIndex < 0) {
        prevIndex = Components.Html.slides.length + prevIndex

        if(prevIndex < 0) {
          return {
            index: Glide.index,
            event: false,
            offset: false
          };
        } else {
          return {
            index: prevIndex,
            event: 'run.start',
            offset: true
          }
        }
      }

      return {
        index: prevIndex,
        event: false,
        offset: false
      }
    },

    getRightCalculation (num) {
      let nextIndex = Glide.index + num

      if(Glide.isType('slider')) {
        if(Components.Html.slides.length < Glide.settings.perView) {
          return {
            index: Glide.index,
            offset: false,
            event: false
          }
        } else if(nextIndex > this.getRealLength()) {
          return {
            index: 0,
            offset: true,
            event: 'run.end'
          }
        }
      }

      if(nextIndex > Components.Html.slides.length  - 1) {
        return {
          index: nextIndex - Components.Html.slides.length,
          offset: true,
          event: 'run.end'
        }
      }

      return {
        index: nextIndex,
        event: false,
        offset: false
      }
    },

    /**
     * Calculates current index based on defined move.
     *
     * @return {Void}
     */
    calculate () {
      let { move, length } = this
      let { steps, direction } = move

      let countableSteps = (isNumber(toInt(steps))) && (toInt(steps) !== 0)
      let stepCount = countableSteps ? Math.abs(toInt(steps)) : 1
      let moveCalculation = null;

      switch (direction) {
        case '>':
          if (steps === '>') {
            moveCalculation = {
              index: this.getRealLength(),
              event: false,
              offset: false
            }
          } else {
            moveCalculation = this.getRightCalculation(stepCount)
          }
          break

        case '<':
          if (steps === '<') {
            moveCalculation = {
              index: 0,
              event: false,
              offset: false
            }
          } else {
            moveCalculation = this.getLeftCalculation(stepCount)
          }
          break

        case '=':
          moveCalculation = {
            index: steps,
            event: false,
            offset: false
          }
          break
      }

      if(moveCalculation) {
        if(moveCalculation.offset) {
          Components.Run._o = true
        }

        Glide.index = moveCalculation.index;

        if(moveCalculation.event) {
          Events.emit(moveCalculation.event, move);
        }
      }
    },

    /**
     * Checks if we are on the first slide.
     *
     * @return {Boolean}
     */
    isStart () {
      return Glide.index === 0
    },

    /**
     * Checks if we are on the last slide.
     *
     * @return {Boolean}
     */
    isEnd () {
      return Glide.index === this.length
    },

    /**
     * Checks if we are making a offset run.
     *
     * @param {String} direction
     * @return {Boolean}
     */
    isOffset (direction) {
      return this._o && this.move.direction === direction
    }
  }

  define(Run, 'move', {
    /**
     * Gets value of the move schema.
     *
     * @returns {Object}
     */
    get () {
      return this._m
    },

    /**
     * Sets value of the move schema.
     *
     * @returns {Object}
     */
    set (value) {
      this._m = {
        direction: value.substr(0, 1),
        steps: value.substr(1) ? value.substr(1) : 0
      }
    }
  })

  define(Run, 'length', {
    /**
     * Gets value of the running distance based
     * on zero-indexing number of slides.
     *
     * @return {Number}
     */
    get () {
      return Components.Html.slides.length - 1
    }
  })

  define(Run, 'offset', {
    /**
     * Gets status of the offsetting flag.
     *
     * @return {Boolean}
     */
    get () {
      return this._o
    }
  })

  return Run
}
