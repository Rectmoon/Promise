const PENDING = 0
const FULFILLED = 1
const REJECTED = 2

class $Promise {
  constructor (fn) {
    this.status = PENDING
    this.value = null
    this.onResolvedCallback = []
    this.onRejectedCallback = []

    try {
      fn(
        v => {
          if (v instanceof $Promise) return v.then(resolve, reject)
          this.triggerResolve(v)
        },
        e => {
          this.triggerReject(e)
        }
      )
    } catch (err) {
      this.triggerReject(err)
    }
  }

  triggerResolve (val) {
    setTimeout(() => {
      this.value = val
      if (this.status === PENDING) {
        this.status = FULFILLED
        this.onResolvedCallback.forEach(h => h(val))
      }
    }, 0)
  }

  triggerReject (val) {
    setTimeout(() => {
      this.value = val
      if (this.status === PENDING) {
        this.status = REJECTED
        this.onRejectedCallback.forEach(h => h(val))
      }
    })
  }

  then (onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => e

    return new $Promise((resolve, reject) => {
      const resolveHandle = val => {
        const res = onResolved(val)
        res instanceof $Promise ? res.then(resolve, reject) : resolve(res)
      }
      const rejectHandle = err => {
        const e = onRejected(err)
        e instanceof $Promise ? e.then(resolve, reject) : reject(e)
      }

      if (this.status === FULFILLED) return resolveHandle(this.value)
      if (this.status === REJECTED) return rejectHandle(this.value)

      this.onResolvedCallback.push(resolveHandle)
      this.onRejectedCallback.push(rejectHandle)
    })
  }

  catch (onRejected) {
    return this.then(null, onRejected)
  }

  finally (callback) {
    return this.then(
      v => $Promise.resolve(callback()).then(() => v),
      e => $Promise.resolve(callback()).then(() => e)
    )
  }

  static resolve () {
    return new $Promise(resolve => {
      resolve(val)
    })
  }

  static reject (val) {
    return new $Promise((_, reject) => {
      reject(val)
    })
  }

  static race (values) {
    return new $Promise((resolve, reject) => {
      let len = values.length
      if (!len) return
      for (let i = 0; i < len; i++) {
        values[i].then(
          res => {
            resolve(res)
          },
          error => {
            reject(error)
          }
        )
      }
    })
  }

  static all (values) {
    return new $Promise((resolve, reject) => {
      let len = values.length
      if (!len) return
      let resolves = []
      let nums = 0
      function processValue (i, val) {
        resolves[i] = val
        if (++nums === len) {
          resolve(resolves)
        }
      }
      for (let i = 0; i < len; i++) {
        values[i].then(
          res => {
            processValue(i, res)
          },
          error => {
            reject(error)
          }
        )
      }
    })
  }
}

/*
 const p1 = new $Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(11)
  }, 3000)
})

const p2 = new $Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(22)
  }, 3000)
})

$Promise.all([p1, p2]).then(r => {
  console.log(r)
})
*/
