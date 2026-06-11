var KnovanaChatWidget = (function (e) {
  (Object.defineProperty(e, Symbol.toStringTag, { value: `Module` }),
    typeof window < `u` && ((window.__svelte ??= {}).v ??= new Set()).add(`5`));
  var t = {},
    n = Symbol(`uninitialized`),
    r = `http://www.w3.org/1999/xhtml`,
    i = `http://www.w3.org/2000/svg`,
    a = `http://www.w3.org/1998/Math/MathML`,
    o = Array.isArray,
    s = Array.prototype.indexOf,
    c = Array.prototype.includes,
    l = Array.from,
    u = Object.keys,
    d = Object.defineProperty,
    f = Object.getOwnPropertyDescriptor,
    p = Object.getOwnPropertyDescriptors,
    m = Object.prototype,
    h = Array.prototype,
    g = Object.getPrototypeOf,
    _ = Object.isExtensible,
    v = () => {};
  function y(e) {
    for (var t = 0; t < e.length; t++) e[t]();
  }
  function b() {
    var e, t;
    return {
      promise: new Promise((n, r) => {
        ((e = n), (t = r));
      }),
      resolve: e,
      reject: t,
    };
  }
  var x = 1024,
    S = 2048,
    C = 4096,
    ee = 8192,
    w = 16384,
    te = 32768,
    ne = 1 << 25,
    re = 65536,
    ie = 1 << 19,
    ae = 1 << 20,
    oe = 1 << 25,
    se = 65536,
    ce = 1 << 21,
    le = 1 << 22,
    ue = 1 << 23,
    T = Symbol(`$state`),
    de = Symbol(`legacy props`),
    fe = Symbol(``),
    pe = Symbol(`attributes`),
    me = Symbol(`class`),
    he = Symbol(`style`),
    ge = Symbol(`text`),
    _e = Symbol(`form reset`),
    ve = new (class extends Error {
      name = `StaleReactionError`;
      message =
        "The reaction that called `getAbortSignal()` was re-run or destroyed";
    })(),
    ye =
      !!globalThis.document?.contentType &&
      globalThis.document.contentType.includes(`xml`);
  function E(e) {
    throw Error(`https://svelte.dev/e/lifecycle_outside_component`);
  }
  function be() {
    throw Error(`https://svelte.dev/e/async_derived_orphan`);
  }
  function D(e, t, n) {
    throw Error(`https://svelte.dev/e/each_key_duplicate`);
  }
  function xe(e) {
    throw Error(`https://svelte.dev/e/effect_in_teardown`);
  }
  function O() {
    throw Error(`https://svelte.dev/e/effect_in_unowned_derived`);
  }
  function Se(e) {
    throw Error(`https://svelte.dev/e/effect_orphan`);
  }
  function Ce() {
    throw Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
  }
  function we() {
    throw Error(`https://svelte.dev/e/hydration_failed`);
  }
  function Te(e) {
    throw Error(`https://svelte.dev/e/props_invalid_value`);
  }
  function Ee() {
    throw Error(`https://svelte.dev/e/state_descriptors_fixed`);
  }
  function De() {
    throw Error(`https://svelte.dev/e/state_prototype_fixed`);
  }
  function Oe() {
    throw Error(`https://svelte.dev/e/state_unsafe_mutation`);
  }
  function ke() {
    throw Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
  }
  function Ae() {
    console.warn(`https://svelte.dev/e/derived_inert`);
  }
  function je(e) {
    console.warn(`https://svelte.dev/e/hydration_mismatch`);
  }
  function Me() {
    console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
  }
  var k = !1;
  function Ne(e) {
    k = e;
  }
  var A;
  function j(e) {
    if (e === null) throw (je(), t);
    return (A = e);
  }
  function Pe() {
    return j(cn(A));
  }
  function M(e) {
    if (k) {
      if (cn(A) !== null) throw (je(), t);
      A = e;
    }
  }
  function Fe(e = 1) {
    if (k) {
      for (var t = e, n = A; t--; ) n = cn(n);
      A = n;
    }
  }
  function Ie(e = !0) {
    for (var t = 0, n = A; ; ) {
      if (n.nodeType === 8) {
        var r = n.data;
        if (r === `]`) {
          if (t === 0) return n;
          --t;
        } else
          (r === `[` ||
            r === `[!` ||
            (r[0] === `[` && !isNaN(Number(r.slice(1))))) &&
            (t += 1);
      }
      var i = cn(n);
      (e && n.remove(), (n = i));
    }
  }
  function Le(e) {
    if (!e || e.nodeType !== 8) throw (je(), t);
    return e.data;
  }
  function Re(e) {
    return e === this.v;
  }
  function ze(e, t) {
    return e == e
      ? e !== t || (typeof e == `object` && !!e) || typeof e == `function`
      : t == t;
  }
  function Be(e) {
    return !ze(e, this.v);
  }
  var Ve = !1,
    He = !1,
    N = null;
  function Ue(e) {
    N = e;
  }
  function We(e, t = !1, n) {
    N = {
      p: N,
      i: !1,
      c: null,
      e: null,
      s: e,
      x: null,
      r: H,
      l: He && !t ? { s: null, u: null, $: [] } : null,
    };
  }
  function Ge(e) {
    var t = N,
      n = t.e;
    if (n !== null) {
      t.e = null;
      for (var r of n) wn(r);
    }
    return (e !== void 0 && (t.x = e), (t.i = !0), (N = t.p), e ?? {});
  }
  function Ke() {
    return !He || (N !== null && N.l === null);
  }
  var qe = [];
  function Je() {
    var e = qe;
    ((qe = []), y(e));
  }
  function Ye(e) {
    if (qe.length === 0 && !Ot) {
      var t = qe;
      queueMicrotask(() => {
        t === qe && Je();
      });
    }
    qe.push(e);
  }
  function Xe() {
    for (; qe.length > 0; ) Je();
  }
  function Ze(e) {
    var t = H;
    if (t === null) return ((V.f |= ue), e);
    if (!(t.f & 32768) && !(t.f & 4)) throw e;
    Qe(e, t);
  }
  function Qe(e, t) {
    if (!(t !== null && t.f & 16384)) {
      for (; t !== null; ) {
        if (t.f & 128) {
          if (!(t.f & 32768)) throw e;
          try {
            t.b.error(e);
            return;
          } catch (t) {
            e = t;
          }
        }
        t = t.parent;
      }
      throw e;
    }
  }
  var $e = ~(S | C | x);
  function P(e, t) {
    e.f = (e.f & $e) | t;
  }
  function et(e) {
    e.f & 512 || e.deps === null ? P(e, x) : P(e, C);
  }
  function F(e) {
    if (e !== null)
      for (let t of e) !(t.f & 2) || !(t.f & 65536) || ((t.f ^= se), F(t.deps));
  }
  function tt(e, t, n) {
    (e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), F(e.deps), P(e, x));
  }
  var nt = !1,
    rt = !1;
  function it(e) {
    var t = rt;
    try {
      return ((rt = !1), [e(), rt]);
    } finally {
      rt = t;
    }
  }
  function at(e) {
    let t = 0,
      n = qt(0),
      r;
    return () => {
      xn() &&
        (U(n),
        kn(
          () => (
            t === 0 && (r = _r(() => e(() => Zt(n)))),
            (t += 1),
            () => {
              Ye(() => {
                (--t, t === 0 && (r?.(), (r = void 0), Zt(n)));
              });
            }
          ),
        ));
    };
  }
  var ot = re | ie;
  function st(e, t, n, r) {
    new ct(e, t, n, r);
  }
  var ct = class {
    parent;
    is_pending = !1;
    transform_error;
    #e;
    #t = k ? A : null;
    #n;
    #r;
    #i;
    #a = null;
    #o = null;
    #s = null;
    #c = null;
    #l = 0;
    #u = 0;
    #d = !1;
    #f = new Set();
    #p = new Set();
    #m = null;
    #h = at(
      () => (
        (this.#m = qt(this.#l)),
        () => {
          this.#m = null;
        }
      ),
    );
    constructor(e, t, n, r) {
      ((this.#e = e),
        (this.#n = t),
        (this.#r = (e) => {
          var t = H;
          ((t.b = this), (t.f |= 128), n(e));
        }),
        (this.parent = H.b),
        (this.transform_error =
          r ?? this.parent?.transform_error ?? ((e) => e)),
        (this.#i = jn(() => {
          if (k) {
            let e = this.#t;
            Pe();
            let t = e.data === `[!`;
            if (e.data.startsWith(`[?`)) {
              let t = JSON.parse(e.data.slice(2));
              this.#_(t);
            } else t ? this.#v() : this.#g();
          } else this.#y();
        }, ot)),
        k && (this.#e = A));
    }
    #g() {
      try {
        this.#a = Mn(() => this.#r(this.#e));
      } catch (e) {
        this.error(e);
      }
    }
    #_(e) {
      let t = this.#n.failed;
      t &&
        (this.#s = Mn(() => {
          t(
            this.#e,
            () => e,
            () => () => {},
          );
        }));
    }
    #v() {
      let e = this.#n.pending;
      e &&
        ((this.is_pending = !0),
        (this.#o = Mn(() => e(this.#e))),
        Ye(() => {
          var e = (this.#c = document.createDocumentFragment()),
            t = on();
          (e.append(t),
            (this.#a = this.#x(() => Mn(() => this.#r(t)))),
            this.#u === 0 &&
              (this.#e.before(e),
              (this.#c = null),
              zn(this.#o, () => {
                this.#o = null;
              }),
              this.#b(I)));
        }));
    }
    #y() {
      try {
        if (
          ((this.is_pending = this.has_pending_snippet()),
          (this.#u = 0),
          (this.#l = 0),
          (this.#a = Mn(() => {
            this.#r(this.#e);
          })),
          this.#u > 0)
        ) {
          var e = (this.#c = document.createDocumentFragment());
          Un(this.#a, e);
          let t = this.#n.pending;
          this.#o = Mn(() => t(this.#e));
        } else this.#b(I);
      } catch (e) {
        this.error(e);
      }
    }
    #b(e) {
      ((this.is_pending = !1), e.transfer_effects(this.#f, this.#p));
    }
    defer_effect(e) {
      tt(e, this.#f, this.#p);
    }
    is_rendered() {
      return !this.is_pending && (!this.parent || this.parent.is_rendered());
    }
    has_pending_snippet() {
      return !!this.#n.pending;
    }
    #x(e) {
      var t = H,
        n = V,
        r = N;
      (Xn(this.#i), Yn(this.#i), Ue(this.#i.ctx));
      try {
        return (Pt.ensure(), e());
      } catch (e) {
        return (Ze(e), null);
      } finally {
        (Xn(t), Yn(n), Ue(r));
      }
    }
    #S(e, t) {
      if (!this.has_pending_snippet()) {
        this.parent && this.parent.#S(e, t);
        return;
      }
      ((this.#u += e),
        this.#u === 0 &&
          (this.#b(t),
          this.#o &&
            zn(this.#o, () => {
              this.#o = null;
            }),
          (this.#c &&= (this.#e.before(this.#c), null))));
    }
    update_pending_count(e, t) {
      (this.#S(e, t),
        (this.#l += e),
        !(!this.#m || this.#d) &&
          ((this.#d = !0),
          Ye(() => {
            ((this.#d = !1), this.#m && Yt(this.#m, this.#l));
          })));
    }
    get_effect_pending() {
      return (this.#h(), U(this.#m));
    }
    error(e) {
      if (!this.#n.onerror && !this.#n.failed) throw e;
      I?.is_fork
        ? (this.#a && I.skip_effect(this.#a),
          this.#o && I.skip_effect(this.#o),
          this.#s && I.skip_effect(this.#s),
          I.oncommit(() => {
            this.#C(e);
          }))
        : this.#C(e);
    }
    #C(e) {
      ((this.#a &&= (In(this.#a), null)),
        (this.#o &&= (In(this.#o), null)),
        (this.#s &&= (In(this.#s), null)),
        k && (j(this.#t), Fe(), j(Ie())));
      var t = this.#n.onerror;
      let n = this.#n.failed;
      var r = !1,
        i = !1;
      let a = () => {
          if (r) {
            Me();
            return;
          }
          ((r = !0),
            i && ke(),
            this.#s !== null &&
              zn(this.#s, () => {
                this.#s = null;
              }),
            this.#x(() => {
              this.#y();
            }));
        },
        o = (e) => {
          try {
            ((i = !0), t?.(e, a), (i = !1));
          } catch (e) {
            Qe(e, this.#i && this.#i.parent);
          }
          n &&
            (this.#s = this.#x(() => {
              try {
                return Mn(() => {
                  var t = H;
                  ((t.b = this),
                    (t.f |= 128),
                    n(
                      this.#e,
                      () => e,
                      () => a,
                    ));
                });
              } catch (e) {
                return (Qe(e, this.#i.parent), null);
              }
            }));
        };
      Ye(() => {
        var t;
        try {
          t = this.transform_error(e);
        } catch (e) {
          Qe(e, this.#i && this.#i.parent);
          return;
        }
        typeof t == `object` && t && typeof t.then == `function`
          ? t.then(o, (e) => Qe(e, this.#i && this.#i.parent))
          : o(t);
      });
    }
  };
  function lt(e, t, n, r) {
    let i = Ke() ? pt : _t;
    var a = e.filter((e) => !e.settled),
      o = t.map(i);
    if (n.length === 0 && a.length === 0) {
      r(o);
      return;
    }
    var s = H,
      c = ut(),
      l =
        a.length === 1
          ? a[0].promise
          : a.length > 1
            ? Promise.all(a.map((e) => e.promise))
            : null;
    function u(e) {
      if (!(s.f & 16384)) {
        c();
        try {
          r([...o, ...e]);
        } catch (e) {
          Qe(e, s);
        }
        dt();
      }
    }
    var d = ft();
    if (n.length === 0) {
      l.then(() => u([])).finally(d);
      return;
    }
    function f() {
      Promise.all(n.map((e) => ht(e)))
        .then(u)
        .catch((e) => Qe(e, s))
        .finally(d);
    }
    l
      ? l.then(() => {
          (c(), f(), dt());
        })
      : f();
  }
  function ut() {
    var e = H,
      t = V,
      n = N,
      r = I;
    return function (i = !0) {
      (Xn(e), Yn(t), Ue(n), i && !(e.f & 16384) && (r?.activate(), r?.apply()));
    };
  }
  function dt(e = !0) {
    (Xn(null), Yn(null), Ue(null), e && I?.deactivate());
  }
  function ft() {
    var e = H,
      t = e.b,
      n = I,
      r = !!t?.is_rendered();
    return (
      t?.update_pending_count(1, n),
      n.increment(r, e),
      () => {
        (t?.update_pending_count(-1, n), n.decrement(r, e));
      }
    );
  }
  function pt(e) {
    var t = 2 | S;
    return (
      H !== null && (H.f |= ie),
      {
        ctx: N,
        deps: null,
        effects: null,
        equals: Re,
        f: t,
        fn: e,
        reactions: null,
        rv: 0,
        v: n,
        wv: 0,
        parent: H,
        ac: null,
      }
    );
  }
  var mt = Symbol(`obsolete`);
  function ht(e, t, r) {
    let i = H;
    i === null && be();
    var a = void 0,
      o = qt(n),
      s = !V,
      c = new Set();
    return (
      On(() => {
        var t = H,
          n = b();
        a = n.promise;
        try {
          Promise.resolve(e())
            .then(n.resolve, (e) => {
              e !== ve && n.reject(e);
            })
            .finally(dt);
        } catch (e) {
          (n.reject(e), dt());
        }
        var r = I;
        if (s) {
          if (t.f & 32768) var l = ft();
          if (i.b?.is_rendered()) r.async_deriveds.get(t)?.reject(mt);
          else for (let e of c.values()) e.reject(mt);
          (c.add(n), r.async_deriveds.set(t, n));
        }
        let u = (e, t = void 0) => {
          (l?.(),
            c.delete(n),
            t !== mt &&
              (r.activate(),
              t
                ? ((o.f |= ue), Yt(o, t))
                : (o.f & 8388608 && (o.f ^= ue), Yt(o, e)),
              r.deactivate()));
        };
        n.promise.then(u, (e) => u(null, e || `unknown`));
      }),
      Sn(() => {
        for (let e of c) e.reject(mt);
      }),
      new Promise((e) => {
        function t(n) {
          function r() {
            n === a ? e(o) : t(a);
          }
          n.then(r, r);
        }
        t(a);
      })
    );
  }
  function gt(e) {
    let t = pt(e);
    return (Ve || Qn(t), t);
  }
  function _t(e) {
    let t = pt(e);
    return ((t.equals = Be), t);
  }
  function vt(e) {
    var t = e.effects;
    if (t !== null) {
      e.effects = null;
      for (var n = 0; n < t.length; n += 1) In(t[n]);
    }
  }
  function yt(e) {
    var t,
      r = H,
      i = e.parent;
    if (!Kn && i !== null && e.v !== n && i.f & 24576) return (Ae(), e.v);
    Xn(i);
    try {
      ((e.f &= ~se), vt(e), (t = ur(e)));
    } finally {
      Xn(r);
    }
    return t;
  }
  function bt(e) {
    var t = yt(e);
    if (
      !e.equals(t) &&
      ((e.wv = sr()),
      (!I?.is_fork || e.deps === null) &&
        (I === null ? (e.v = t) : (I.capture(e, t, !0), Tt?.capture(e, t, !0)),
        e.deps === null))
    ) {
      P(e, x);
      return;
    }
    Kn || (Et === null ? et(e) : (xn() || I?.is_fork) && Et.set(e, t));
  }
  function xt(e) {
    if (e.effects !== null)
      for (let t of e.effects)
        (t.teardown || t.ac) &&
          (t.teardown?.(),
          t.ac?.abort(ve),
          t.fn !== null && (t.teardown = v),
          (t.ac = null),
          fr(t, 0),
          Pn(t));
  }
  function St(e) {
    if (e.effects !== null)
      for (let t of e.effects) t.teardown && t.fn !== null && pr(t);
  }
  var Ct = null,
    wt = null,
    I = null,
    Tt = null,
    Et = null,
    Dt = null,
    Ot = !1,
    kt = !1,
    At = null,
    jt = null,
    Mt = 0,
    Nt = 1,
    Pt = class e {
      id = Nt++;
      #e = !1;
      linked = !0;
      #t = null;
      #n = null;
      async_deriveds = new Map();
      current = new Map();
      previous = new Map();
      #r = new Set();
      #i = new Set();
      #a = 0;
      #o = new Map();
      #s = null;
      #c = [];
      #l = [];
      #u = new Set();
      #d = new Set();
      #f = new Map();
      #p = new Set();
      is_fork = !1;
      #m = !1;
      constructor() {
        (wt === null ? (Ct = wt = this) : ((wt.#n = this), (this.#t = wt)),
          (wt = this));
      }
      #h() {
        if (this.is_fork) return !0;
        for (let n of this.#o.keys()) {
          for (var e = n, t = !1; e.parent !== null; ) {
            if (this.#f.has(e)) {
              t = !0;
              break;
            }
            e = e.parent;
          }
          if (!t) return !0;
        }
        return !1;
      }
      skip_effect(e) {
        (this.#f.has(e) || this.#f.set(e, { d: [], m: [] }), this.#p.delete(e));
      }
      unskip_effect(e, t = (e) => this.schedule(e)) {
        var n = this.#f.get(e);
        if (n) {
          this.#f.delete(e);
          for (var r of n.d) (P(r, S), t(r));
          for (r of n.m) (P(r, C), t(r));
        }
        this.#p.add(e);
      }
      #g() {
        ((this.#e = !0), Mt++ > 1e3 && (this.#S(), It()));
        for (let e of this.#u) (this.#d.delete(e), P(e, S), this.schedule(e));
        for (let e of this.#d) (P(e, C), this.schedule(e));
        let t = this.#c;
        ((this.#c = []), this.apply());
        var n = (At = []),
          r = [],
          i = (jt = []);
        for (let e of t)
          try {
            this.#_(e, n, r);
          } catch (t) {
            throw (Ut(e), this.#h() || this.discard(), t);
          }
        if (((I = null), i.length > 0)) {
          var a = e.ensure();
          for (let e of i) a.schedule(e);
        }
        if (((At = null), (jt = null), this.#h())) {
          (this.#b(r), this.#b(n));
          for (let [e, t] of this.#f) Ht(e, t);
          i.length > 0 && I.#g();
          return;
        }
        let o = this.#v();
        if (o) {
          (this.#b(r), this.#b(n), o.#y(this));
          return;
        }
        (this.#u.clear(), this.#d.clear());
        for (let e of this.#r) e(this);
        (this.#r.clear(),
          (Tt = this),
          Rt(r),
          Rt(n),
          (Tt = null),
          this.#s?.resolve());
        var s = I;
        if (
          (this.#a === 0 &&
            (this.#c.length === 0 || s !== null) &&
            (this.#S(), Ve && (this.#x(), (I = s))),
          this.#c.length > 0)
        )
          if (s !== null) {
            let e = s;
            e.#c.push(...this.#c.filter((t) => !e.#c.includes(t)));
          } else s = this;
        s !== null && s.#g();
      }
      #_(e, t, n) {
        e.f ^= x;
        for (var r = e.first; r !== null; ) {
          var i = r.f,
            a = (i & 96) != 0;
          if (
            !((a && i & 1024) || i & 8192 || this.#f.has(r)) &&
            r.fn !== null
          ) {
            a
              ? (r.f ^= x)
              : i & 4
                ? t.push(r)
                : Ve && i & 16777224
                  ? n.push(r)
                  : cr(r) && (i & 16 && this.#d.add(r), pr(r));
            var o = r.first;
            if (o !== null) {
              r = o;
              continue;
            }
          }
          for (; r !== null; ) {
            var s = r.next;
            if (s !== null) {
              r = s;
              break;
            }
            r = r.parent;
          }
        }
      }
      #v() {
        for (var e = this.#t; e !== null; ) {
          if (!e.is_fork) {
            for (let [t, [, n]] of this.current)
              if (e.current.has(t) && !n) return e;
          }
          e = e.#t;
        }
        return null;
      }
      #y(e) {
        for (let [t, n] of e.current)
          (!this.previous.has(t) &&
            e.previous.has(t) &&
            this.previous.set(t, e.previous.get(t)),
            this.current.set(t, n));
        for (let [t, n] of e.async_deriveds) {
          let e = this.async_deriveds.get(t);
          e && n.promise.then(e.resolve).catch(e.reject);
        }
        (e.async_deriveds.clear(), this.transfer_effects(e.#u, e.#d));
        let t = (e) => {
          var n = e.reactions;
          if (n !== null)
            for (let e of n) {
              var r = e.f;
              if (r & 2) t(e);
              else {
                var i = e;
                r & 4194320 &&
                  !this.async_deriveds.has(i) &&
                  (this.#d.delete(i), P(i, S), this.schedule(i));
              }
            }
        };
        for (let e of this.current.keys()) t(e);
        (this.oncommit(() => e.discard()), e.#S(), (I = this), this.#g());
      }
      #b(e) {
        for (var t = 0; t < e.length; t += 1) tt(e[t], this.#u, this.#d);
      }
      capture(e, t, r = !1) {
        (e.v !== n && !this.previous.has(e) && this.previous.set(e, e.v),
          e.f & 8388608 || (this.current.set(e, [t, r]), Et?.set(e, t)),
          this.is_fork || (e.v = t));
      }
      activate() {
        I = this;
      }
      deactivate() {
        ((I = null), (Et = null));
      }
      flush() {
        try {
          ((kt = !0), (I = this), this.#g());
        } finally {
          ((Mt = 0),
            (Dt = null),
            (At = null),
            (jt = null),
            (kt = !1),
            (I = null),
            (Et = null),
            Gt.clear());
        }
      }
      discard() {
        for (let e of this.#i) e(this);
        this.#i.clear();
        for (let e of this.async_deriveds.values()) e.reject(mt);
        (this.#S(), this.#s?.resolve());
      }
      register_created_effect(e) {
        this.#l.push(e);
      }
      #x() {
        for (let u = Ct; u !== null; u = u.#n) {
          var e = u.id < this.id,
            t = [];
          for (let [r, [i, a]] of this.current) {
            if (u.current.has(r)) {
              var n = u.current.get(r)[0];
              if (e && i !== n) u.current.set(r, [i, a]);
              else continue;
            }
            t.push(r);
          }
          if (e)
            for (let [e, t] of this.async_deriveds) {
              let n = u.async_deriveds.get(e);
              n && t.promise.then(n.resolve).catch(n.reject);
            }
          var r = [...u.current.keys()].filter((e) => !u.current.get(e)[1]);
          if (!(!u.#e || r.length === 0)) {
            var i = r.filter((e) => !this.current.has(e));
            if (i.length === 0) e && u.discard();
            else if (t.length > 0) {
              if (e)
                for (let e of this.#p)
                  u.unskip_effect(e, (e) => {
                    e.f & 4194320 ? u.schedule(e) : u.#b([e]);
                  });
              u.activate();
              var a = new Set(),
                o = new Map();
              for (var s of t) zt(s, i, a, o);
              o = new Map();
              var c = [...u.current]
                .filter(([e, t]) => {
                  let n = this.current.get(e);
                  return n ? n[0] !== t[0] || n[1] !== t[1] : !0;
                })
                .map(([e]) => e);
              if (c.length > 0)
                for (let e of this.#l)
                  !(e.f & 155648) &&
                    Bt(e, c, o) &&
                    (e.f & 4194320 ? (P(e, S), u.schedule(e)) : u.#u.add(e));
              if (u.#c.length > 0 && !u.#m) {
                u.apply();
                for (var l of u.#c) u.#_(l, [], []);
                u.#c = [];
              }
              u.deactivate();
            }
          }
        }
      }
      increment(e, t) {
        if (((this.#a += 1), e)) {
          let e = this.#o.get(t) ?? 0;
          this.#o.set(t, e + 1);
        }
      }
      decrement(e, t) {
        if ((--this.#a, e)) {
          let e = this.#o.get(t) ?? 0;
          e === 1 ? this.#o.delete(t) : this.#o.set(t, e - 1);
        }
        this.#m ||
          ((this.#m = !0),
          Ye(() => {
            ((this.#m = !1), this.linked && this.flush());
          }));
      }
      transfer_effects(e, t) {
        for (let t of e) this.#u.add(t);
        for (let e of t) this.#d.add(e);
        (e.clear(), t.clear());
      }
      oncommit(e) {
        this.#r.add(e);
      }
      ondiscard(e) {
        this.#i.add(e);
      }
      settled() {
        return (this.#s ??= b()).promise;
      }
      static ensure() {
        if (I === null) {
          let t = (I = new e());
          !kt &&
            !Ot &&
            Ye(() => {
              t.#e || t.flush();
            });
        }
        return I;
      }
      apply() {
        if (!Ve || (!this.is_fork && this.#t === null && this.#n === null)) {
          Et = null;
          return;
        }
        Et = new Map();
        for (let [e, [t]] of this.current) Et.set(e, t);
        for (let t = Ct; t !== null; t = t.#n)
          if (!(t === this || t.is_fork)) {
            var e = !1;
            if (t.id < this.id) {
              for (let [n, [, r]] of t.current)
                if (!r && this.current.has(n)) {
                  e = !0;
                  break;
                }
            }
            if (!e) for (let [e, n] of t.previous) Et.has(e) || Et.set(e, n);
          }
      }
      schedule(e) {
        if (((Dt = e), e.b?.is_pending && e.f & 16777228 && !(e.f & 32768))) {
          e.b.defer_effect(e);
          return;
        }
        for (var t = e; t.parent !== null; ) {
          t = t.parent;
          var n = t.f;
          if (
            At !== null &&
            t === H &&
            (Ve || ((V === null || !(V.f & 2)) && !nt))
          )
            return;
          if (n & 96) {
            if (!(n & 1024)) return;
            t.f ^= x;
          }
        }
        this.#c.push(t);
      }
      #S() {
        if (this.linked) {
          var e = this.#t,
            t = this.#n;
          (e === null ? (Ct = t) : (e.#n = t),
            t === null ? (wt = e) : (t.#t = e),
            (this.linked = !1));
        }
      }
    };
  function Ft(e) {
    var t = Ot;
    Ot = !0;
    try {
      var n;
      for (e && (I !== null && !I.is_fork && I.flush(), (n = e())); ; ) {
        if ((Xe(), I === null)) return n;
        I.flush();
      }
    } finally {
      Ot = t;
    }
  }
  function It() {
    try {
      Ce();
    } catch (e) {
      Qe(e, Dt);
    }
  }
  var Lt = null;
  function Rt(e) {
    var t = e.length;
    if (t !== 0) {
      for (var n = 0; n < t; ) {
        var r = e[n++];
        if (
          !(r.f & 24576) &&
          cr(r) &&
          ((Lt = new Set()),
          pr(r),
          r.deps === null &&
            r.first === null &&
            r.nodes === null &&
            r.teardown === null &&
            r.ac === null &&
            Rn(r),
          Lt?.size > 0)
        ) {
          Gt.clear();
          for (let e of Lt) {
            if (e.f & 24576) continue;
            let t = [e],
              n = e.parent;
            for (; n !== null; )
              (Lt.has(n) && (Lt.delete(n), t.push(n)), (n = n.parent));
            for (let e = t.length - 1; e >= 0; e--) {
              let n = t[e];
              n.f & 24576 || pr(n);
            }
          }
          Lt.clear();
        }
      }
      Lt = null;
    }
  }
  function zt(e, t, n, r) {
    if (!n.has(e) && (n.add(e), e.reactions !== null))
      for (let i of e.reactions) {
        let e = i.f;
        e & 2
          ? zt(i, t, n, r)
          : e & 4194320 && !(e & 2048) && Bt(i, t, r) && (P(i, S), Vt(i));
      }
  }
  function Bt(e, t, n) {
    let r = n.get(e);
    if (r !== void 0) return r;
    if (e.deps !== null)
      for (let r of e.deps) {
        if (c.call(t, r)) return !0;
        if (r.f & 2 && Bt(r, t, n)) return (n.set(r, !0), !0);
      }
    return (n.set(e, !1), !1);
  }
  function Vt(e) {
    I.schedule(e);
  }
  function Ht(e, t) {
    if (!(e.f & 32 && e.f & 1024)) {
      (e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), P(e, x));
      for (var n = e.first; n !== null; ) (Ht(n, t), (n = n.next));
    }
  }
  function Ut(e) {
    P(e, x);
    for (var t = e.first; t !== null; ) (Ut(t), (t = t.next));
  }
  var Wt = new Set(),
    Gt = new Map(),
    Kt = !1;
  function qt(e, t) {
    return { f: 0, v: e, reactions: null, equals: Re, rv: 0, wv: 0 };
  }
  function L(e, t) {
    let n = qt(e, t);
    return (Qn(n), n);
  }
  function Jt(e, t = !1, n = !0) {
    let r = qt(e);
    return (
      t || (r.equals = Be),
      He && n && N !== null && N.l !== null && (N.l.s ??= []).push(r),
      r
    );
  }
  function R(e, t, n = !1) {
    return (
      V !== null &&
        (!Jn || V.f & 131072) &&
        Ke() &&
        V.f & 4325394 &&
        (Zn === null || !Zn.has(e)) &&
        Oe(),
      Yt(e, n ? $t(t) : t, jt)
    );
  }
  function Yt(e, t, n = null) {
    if (!e.equals(t)) {
      Gt.set(e, Kn ? t : e.v);
      var r = Pt.ensure();
      if ((r.capture(e, t), e.f & 2)) {
        let t = e;
        (e.f & 2048 && yt(t), Et === null && et(t));
      }
      ((e.wv = sr()),
        Qt(e, S, n),
        Ke() &&
          H !== null &&
          H.f & 1024 &&
          !(H.f & 96) &&
          (tr === null ? nr([e]) : tr.push(e)),
        !r.is_fork && Wt.size > 0 && !Kt && Xt());
    }
    return t;
  }
  function Xt() {
    Kt = !1;
    for (let e of Wt) {
      e.f & 1024 && P(e, C);
      let t;
      try {
        t = cr(e);
      } catch {
        t = !0;
      }
      t && pr(e);
    }
    Wt.clear();
  }
  function Zt(e) {
    R(e, e.v + 1);
  }
  function Qt(e, t, n) {
    var r = e.reactions;
    if (r !== null)
      for (var i = Ke(), a = r.length, o = 0; o < a; o++) {
        var s = r[o],
          c = s.f;
        if (!(!i && s === H)) {
          var l = (c & S) === 0;
          if ((l && P(s, t), c & 131072)) Wt.add(s);
          else if (c & 2) {
            var u = s;
            (Et?.delete(u),
              c & 65536 ||
                (c & 512 && (H === null || !(H.f & 2097152)) && (s.f |= se),
                Qt(u, C, n)));
          } else if (l) {
            var d = s;
            (c & 16 && Lt !== null && Lt.add(d),
              n === null ? Vt(d) : n.push(d));
          }
        }
      }
  }
  function $t(e) {
    if (typeof e != `object` || !e || T in e) return e;
    let t = g(e);
    if (t !== m && t !== h) return e;
    var r = new Map(),
      i = o(e),
      a = L(0),
      s = null,
      c = ar,
      l = (e) => {
        if (ar === c) return e();
        var t = V,
          n = ar;
        (Yn(null), or(c));
        var r = e();
        return (Yn(t), or(n), r);
      };
    return (
      i && r.set(`length`, L(e.length, s)),
      new Proxy(e, {
        defineProperty(e, t, n) {
          (!(`value` in n) ||
            n.configurable === !1 ||
            n.enumerable === !1 ||
            n.writable === !1) &&
            Ee();
          var i = r.get(t);
          return (
            i === void 0
              ? l(() => {
                  var e = L(n.value, s);
                  return (r.set(t, e), e);
                })
              : R(i, n.value, !0),
            !0
          );
        },
        deleteProperty(e, t) {
          var i = r.get(t);
          if (i === void 0) {
            if (t in e) {
              let e = l(() => L(n, s));
              (r.set(t, e), Zt(a));
            }
          } else (R(i, n), Zt(a));
          return !0;
        },
        get(t, i, a) {
          if (i === T) return e;
          var o = r.get(i),
            c = i in t;
          if (
            (o === void 0 &&
              (!c || f(t, i)?.writable) &&
              ((o = l(() => L($t(c ? t[i] : n), s))), r.set(i, o)),
            o !== void 0)
          ) {
            var u = U(o);
            return u === n ? void 0 : u;
          }
          return Reflect.get(t, i, a);
        },
        getOwnPropertyDescriptor(e, t) {
          var i = Reflect.getOwnPropertyDescriptor(e, t);
          if (i && `value` in i) {
            var a = r.get(t);
            a && (i.value = U(a));
          } else if (i === void 0) {
            var o = r.get(t),
              s = o?.v;
            if (o !== void 0 && s !== n)
              return {
                enumerable: !0,
                configurable: !0,
                value: s,
                writable: !0,
              };
          }
          return i;
        },
        has(e, t) {
          if (t === T) return !0;
          var i = r.get(t),
            a = (i !== void 0 && i.v !== n) || Reflect.has(e, t);
          return (i !== void 0 || (H !== null && (!a || f(e, t)?.writable))) &&
            (i === void 0 &&
              ((i = l(() => L(a ? $t(e[t]) : n, s))), r.set(t, i)),
            U(i) === n)
            ? !1
            : a;
        },
        set(e, t, o, c) {
          var u = r.get(t),
            d = t in e;
          if (i && t === `length`)
            for (var p = o; p < u.v; p += 1) {
              var m = r.get(p + ``);
              m === void 0
                ? p in e && ((m = l(() => L(n, s))), r.set(p + ``, m))
                : R(m, n);
            }
          if (u === void 0)
            (!d || f(e, t)?.writable) &&
              ((u = l(() => L(void 0, s))), R(u, $t(o)), r.set(t, u));
          else {
            d = u.v !== n;
            var h = l(() => $t(o));
            R(u, h);
          }
          var g = Reflect.getOwnPropertyDescriptor(e, t);
          if ((g?.set && g.set.call(c, o), !d)) {
            if (i && typeof t == `string`) {
              var _ = r.get(`length`),
                v = Number(t);
              Number.isInteger(v) && v >= _.v && R(_, v + 1);
            }
            Zt(a);
          }
          return !0;
        },
        ownKeys(e) {
          U(a);
          var t = Reflect.ownKeys(e).filter((e) => {
            var t = r.get(e);
            return t === void 0 || t.v !== n;
          });
          for (var [i, o] of r) o.v !== n && !(i in e) && t.push(i);
          return t;
        },
        setPrototypeOf() {
          De();
        },
      })
    );
  }
  new Set([
    `copyWithin`,
    `fill`,
    `pop`,
    `push`,
    `reverse`,
    `shift`,
    `sort`,
    `splice`,
    `unshift`,
  ]);
  var en, tn, nn, rn;
  function an() {
    if (en === void 0) {
      ((en = window), (tn = /Firefox/.test(navigator.userAgent)));
      var e = Element.prototype,
        t = Node.prototype,
        n = Text.prototype;
      ((nn = f(t, `firstChild`).get),
        (rn = f(t, `nextSibling`).get),
        _(e) &&
          ((e[me] = void 0),
          (e[pe] = null),
          (e[he] = void 0),
          (e.__e = void 0)),
        _(n) && (n[ge] = void 0));
    }
  }
  function on(e = ``) {
    return document.createTextNode(e);
  }
  function sn(e) {
    return nn.call(e);
  }
  function cn(e) {
    return rn.call(e);
  }
  function z(e, t) {
    if (!k) return sn(e);
    var n = sn(A);
    if (n === null) n = A.appendChild(on());
    else if (t && n.nodeType !== 3) {
      var r = on();
      return (n?.before(r), j(r), r);
    }
    return (t && fn(n), j(n), n);
  }
  function B(e, t = 1, n = !1) {
    let r = k ? A : e;
    for (var i; t--; ) ((i = r), (r = cn(r)));
    if (!k) return r;
    if (n) {
      if (r?.nodeType !== 3) {
        var a = on();
        return (r === null ? i?.after(a) : r.before(a), j(a), a);
      }
      fn(r);
    }
    return (j(r), r);
  }
  function ln(e) {
    e.textContent = ``;
  }
  function un() {
    return !Ve || Lt !== null ? !1 : (H.f & te) !== 0;
  }
  function dn(e, t, n) {
    return t == null || t === `http://www.w3.org/1999/xhtml`
      ? n
        ? document.createElement(e, { is: n })
        : document.createElement(e)
      : n
        ? document.createElementNS(t, e, { is: n })
        : document.createElementNS(t, e);
  }
  function fn(e) {
    if (e.nodeValue.length < 65536) return;
    let t = e.nextSibling;
    for (; t !== null && t.nodeType === 3; )
      (t.remove(), (e.nodeValue += t.nodeValue), (t = e.nextSibling));
  }
  function pn(e) {
    k && sn(e) !== null && ln(e);
  }
  var mn = !1;
  function hn() {
    mn ||
      ((mn = !0),
      document.addEventListener(
        `reset`,
        (e) => {
          Promise.resolve().then(() => {
            if (!e.defaultPrevented) for (let t of e.target.elements) t[_e]?.();
          });
        },
        { capture: !0 },
      ));
  }
  function gn(e) {
    var t = V,
      n = H;
    (Yn(null), Xn(null));
    try {
      return e();
    } finally {
      (Yn(t), Xn(n));
    }
  }
  function _n(e, t, n, r = n) {
    e.addEventListener(t, () => gn(n));
    let i = e[_e];
    (i
      ? (e[_e] = () => {
          (i(), r(!0));
        })
      : (e[_e] = () => r(!0)),
      hn());
  }
  function vn(e) {
    (H === null && (V === null && Se(e), O()), Kn && xe(e));
  }
  function yn(e, t) {
    var n = t.last;
    n === null
      ? (t.last = t.first = e)
      : ((n.next = e), (e.prev = n), (t.last = e));
  }
  function bn(e, t) {
    var n = H;
    n !== null && n.f & 8192 && (e |= ee);
    var r = {
      ctx: N,
      deps: null,
      nodes: null,
      f: e | S | 512,
      first: null,
      fn: t,
      last: null,
      next: null,
      parent: n,
      b: n && n.b,
      prev: null,
      teardown: null,
      wv: 0,
      ac: null,
    };
    I?.register_created_effect(r);
    var i = r;
    if (e & 4) At === null ? Pt.ensure().schedule(r) : At.push(r);
    else if (t !== null) {
      try {
        pr(r);
      } catch (e) {
        throw (In(r), e);
      }
      i.deps === null &&
        i.teardown === null &&
        i.nodes === null &&
        i.first === i.last &&
        !(i.f & 524288) &&
        ((i = i.first), e & 16 && e & 65536 && i !== null && (i.f |= re));
    }
    if (
      i !== null &&
      ((i.parent = n),
      n !== null && yn(i, n),
      V !== null && V.f & 2 && !(e & 64))
    ) {
      var a = V;
      (a.effects ??= []).push(i);
    }
    return r;
  }
  function xn() {
    return V !== null && !Jn;
  }
  function Sn(e) {
    let t = bn(8, null);
    return (P(t, x), (t.teardown = e), t);
  }
  function Cn(e) {
    vn(`$effect`);
    var t = H.f;
    if (!V && t & 32 && N !== null && !N.i) {
      var n = N;
      (n.e ??= []).push(e);
    } else return wn(e);
  }
  function wn(e) {
    return bn(4 | ae, e);
  }
  function Tn(e) {
    Pt.ensure();
    let t = bn(64 | ie, e);
    return () => {
      In(t);
    };
  }
  function En(e) {
    Pt.ensure();
    let t = bn(64 | ie, e);
    return (e = {}) =>
      new Promise((n) => {
        e.outro
          ? zn(t, () => {
              (In(t), n(void 0));
            })
          : (In(t), n(void 0));
      });
  }
  function Dn(e) {
    return bn(4, e);
  }
  function On(e) {
    return bn(le | ie, e);
  }
  function kn(e, t = 0) {
    return bn(8 | t, e);
  }
  function An(e, t = [], n = [], r = []) {
    lt(r, t, n, (t) => {
      bn(8, () => {
        e(...t.map(U));
      });
    });
  }
  function jn(e, t = 0) {
    return bn(16 | t, e);
  }
  function Mn(e) {
    return bn(32 | ie, e);
  }
  function Nn(e) {
    var t = e.teardown;
    if (t !== null) {
      let e = Kn,
        n = V;
      (qn(!0), Yn(null));
      try {
        t.call(null);
      } finally {
        (qn(e), Yn(n));
      }
    }
  }
  function Pn(e, t = !1) {
    var n = e.first;
    for (e.first = e.last = null; n !== null; ) {
      let e = n.ac;
      e !== null &&
        gn(() => {
          e.abort(ve);
        });
      var r = n.next;
      (n.f & 64 ? (n.parent = null) : In(n, t), (n = r));
    }
  }
  function Fn(e) {
    for (var t = e.first; t !== null; ) {
      var n = t.next;
      (t.f & 32 || In(t), (t = n));
    }
  }
  function In(e, t = !0) {
    var n = !1;
    ((t || e.f & 262144) &&
      e.nodes !== null &&
      e.nodes.end !== null &&
      (Ln(e.nodes.start, e.nodes.end), (n = !0)),
      (e.f |= ne),
      Pn(e, t && !n),
      fr(e, 0));
    var r = e.nodes && e.nodes.t;
    if (r !== null) for (let e of r) e.stop();
    (Nn(e), (e.f ^= ne), (e.f |= w));
    var i = e.parent;
    (i !== null && i.first !== null && Rn(e),
      (e.next =
        e.prev =
        e.teardown =
        e.ctx =
        e.deps =
        e.fn =
        e.nodes =
        e.ac =
        e.b =
          null));
  }
  function Ln(e, t) {
    for (; e !== null; ) {
      var n = e === t ? null : cn(e);
      (e.remove(), (e = n));
    }
  }
  function Rn(e) {
    var t = e.parent,
      n = e.prev,
      r = e.next;
    (n !== null && (n.next = r),
      r !== null && (r.prev = n),
      t !== null &&
        (t.first === e && (t.first = r), t.last === e && (t.last = n)));
  }
  function zn(e, t, n = !0) {
    var r = [];
    Bn(e, r, !0);
    var i = () => {
        (n && In(e), t && t());
      },
      a = r.length;
    if (a > 0) {
      var o = () => --a || i();
      for (var s of r) s.out(o);
    } else i();
  }
  function Bn(e, t, n) {
    if (!(e.f & 8192)) {
      e.f ^= ee;
      var r = e.nodes && e.nodes.t;
      if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
      for (var i = e.first; i !== null; ) {
        var a = i.next;
        if (!(i.f & 64)) {
          var o = (i.f & 65536) != 0 || ((i.f & 32) != 0 && (e.f & 16) != 0);
          Bn(i, t, o ? n : !1);
        }
        i = a;
      }
    }
  }
  function Vn(e) {
    Hn(e, !0);
  }
  function Hn(e, t) {
    if (e.f & 8192) {
      ((e.f ^= ee), e.f & 1024 || (P(e, S), Pt.ensure().schedule(e)));
      for (var n = e.first; n !== null; ) {
        var r = n.next,
          i = (n.f & 65536) != 0 || (n.f & 32) != 0;
        (Hn(n, i ? t : !1), (n = r));
      }
      var a = e.nodes && e.nodes.t;
      if (a !== null) for (let e of a) (e.is_global || t) && e.in();
    }
  }
  function Un(e, t) {
    if (e.nodes)
      for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
        var i = n === r ? null : cn(n);
        (t.append(n), (n = i));
      }
  }
  var Wn = null,
    Gn = !1,
    Kn = !1;
  function qn(e) {
    Kn = e;
  }
  var V = null,
    Jn = !1;
  function Yn(e) {
    V = e;
  }
  var H = null;
  function Xn(e) {
    H = e;
  }
  var Zn = null;
  function Qn(e) {
    V !== null && (!Ve || V.f & 2) && (Zn ??= new Set()).add(e);
  }
  var $n = null,
    er = 0,
    tr = null;
  function nr(e) {
    tr = e;
  }
  var rr = 1,
    ir = 0,
    ar = ir;
  function or(e) {
    ar = e;
  }
  function sr() {
    return ++rr;
  }
  function cr(e) {
    var t = e.f;
    if (t & 2048) return !0;
    if ((t & 2 && (e.f &= ~se), t & 4096)) {
      for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
        var a = n[i];
        if ((cr(a) && bt(a), a.wv > e.wv)) return !0;
      }
      t & 512 && Et === null && P(e, x);
    }
    return !1;
  }
  function lr(e, t, n = !0) {
    var r = e.reactions;
    if (r !== null && !(!Ve && Zn !== null && Zn.has(e)))
      for (var i = 0; i < r.length; i++) {
        var a = r[i];
        a.f & 2
          ? lr(a, t, !1)
          : t === a && (n ? P(a, S) : a.f & 1024 && P(a, C), Vt(a));
      }
  }
  function ur(e) {
    var t = $n,
      n = er,
      r = tr,
      i = V,
      a = Zn,
      o = N,
      s = Jn,
      c = ar,
      l = e.f;
    (($n = null),
      (er = 0),
      (tr = null),
      (V = l & 96 ? null : e),
      (Zn = null),
      Ue(e.ctx),
      (Jn = !1),
      (ar = ++ir),
      e.ac !== null &&
        (gn(() => {
          e.ac.abort(ve);
        }),
        (e.ac = null)));
    try {
      e.f |= ce;
      var u = e.fn,
        d = u();
      e.f |= te;
      var f = e.deps,
        p = I?.is_fork;
      if ($n !== null) {
        var m;
        if ((p || fr(e, er), f !== null && er > 0))
          for (f.length = er + $n.length, m = 0; m < $n.length; m++)
            f[er + m] = $n[m];
        else e.deps = f = $n;
        if (xn() && e.f & 512)
          for (m = er; m < f.length; m++) (f[m].reactions ??= []).push(e);
      } else !p && f !== null && er < f.length && (fr(e, er), (f.length = er));
      if (Ke() && tr !== null && !Jn && f !== null && !(e.f & 6146))
        for (m = 0; m < tr.length; m++) lr(tr[m], e);
      if (i !== null && i !== e) {
        if ((ir++, i.deps !== null))
          for (let e = 0; e < n; e += 1) i.deps[e].rv = ir;
        if (t !== null) for (let e of t) e.rv = ir;
        tr !== null && (r === null ? (r = tr) : r.push(...tr));
      }
      return (e.f & 8388608 && (e.f ^= ue), d);
    } catch (e) {
      return Ze(e);
    } finally {
      ((e.f ^= ce),
        ($n = t),
        (er = n),
        (tr = r),
        (V = i),
        (Zn = a),
        Ue(o),
        (Jn = s),
        (ar = c));
    }
  }
  function dr(e, t) {
    let r = t.reactions;
    if (r !== null) {
      var i = s.call(r, e);
      if (i !== -1) {
        var a = r.length - 1;
        a === 0 ? (r = t.reactions = null) : ((r[i] = r[a]), r.pop());
      }
    }
    if (r === null && t.f & 2 && ($n === null || !c.call($n, t))) {
      var o = t;
      (o.f & 512 && ((o.f ^= 512), (o.f &= ~se)),
        o.v !== n && et(o),
        xt(o),
        fr(o, 0));
    }
  }
  function fr(e, t) {
    var n = e.deps;
    if (n !== null) for (var r = t; r < n.length; r++) dr(e, n[r]);
  }
  function pr(e) {
    var t = e.f;
    if (!(t & 16384)) {
      P(e, x);
      var n = H,
        r = Gn;
      ((H = e), (Gn = !0));
      try {
        (t & 16777232 ? Fn(e) : Pn(e), Nn(e));
        var i = ur(e);
        ((e.teardown = typeof i == `function` ? i : null), (e.wv = rr));
      } finally {
        ((Gn = r), (H = n));
      }
    }
  }
  async function mr() {
    if (Ve)
      return new Promise((e) => {
        (requestAnimationFrame(() => e()), setTimeout(() => e()));
      });
    (await Promise.resolve(), Ft());
  }
  function U(e) {
    var t = (e.f & 2) != 0;
    if (
      (Wn?.add(e),
      V !== null &&
        !Jn &&
        !(H !== null && H.f & 16384) &&
        (Zn === null || !Zn.has(e)))
    ) {
      var n = V.deps;
      if (V.f & 2097152)
        e.rv < ir &&
          ((e.rv = ir),
          $n === null && n !== null && n[er] === e
            ? er++
            : $n === null
              ? ($n = [e])
              : $n.push(e));
      else {
        ((V.deps ??= []), c.call(V.deps, e) || V.deps.push(e));
        var r = e.reactions;
        r === null ? (e.reactions = [V]) : c.call(r, V) || r.push(V);
      }
    }
    if (Kn && Gt.has(e)) return Gt.get(e);
    if (t) {
      var i = e;
      if (Kn) {
        var a = i.v;
        return (
          ((!(i.f & 1024) && i.reactions !== null) || gr(i)) && (a = yt(i)),
          Gt.set(i, a),
          a
        );
      }
      var o = (i.f & 512) == 0 && !Jn && V !== null && (Gn || (V.f & 512) != 0),
        s = (i.f & te) === 0;
      (cr(i) && (o && (i.f |= 512), bt(i)), o && !s && (St(i), hr(i)));
    }
    if (Et?.has(e)) return Et.get(e);
    if (e.f & 8388608) throw e.v;
    return e.v;
  }
  function hr(e) {
    if (((e.f |= 512), e.deps !== null))
      for (let t of e.deps)
        ((t.reactions ??= []).push(e),
          t.f & 2 && !(t.f & 512) && (St(t), hr(t)));
  }
  function gr(e) {
    if (e.v === n) return !0;
    if (e.deps === null) return !1;
    for (let t of e.deps) if (Gt.has(t) || (t.f & 2 && gr(t))) return !0;
    return !1;
  }
  function _r(e) {
    var t = Jn;
    try {
      return ((Jn = !0), e());
    } finally {
      Jn = t;
    }
  }
  var vr = Symbol(`events`),
    yr = new Set(),
    br = new Set();
  function xr(e, t, n) {
    (t[vr] ??= {})[e] = n;
  }
  function Sr(e) {
    for (var t = 0; t < e.length; t++) yr.add(e[t]);
    for (var n of br) n(e);
  }
  var Cr = null;
  function wr(e) {
    var t = this,
      n = t.ownerDocument,
      r = e.type,
      i = e.composedPath?.() || [],
      a = i[0] || e.target;
    Cr = e;
    var o = 0,
      s = Cr === e && e[vr];
    if (s) {
      var c = i.indexOf(s);
      if (c !== -1 && (t === document || t === window)) {
        e[vr] = t;
        return;
      }
      var l = i.indexOf(t);
      if (l === -1) return;
      c <= l && (o = c);
    }
    if (((a = i[o] || e.target), a !== t)) {
      d(e, `currentTarget`, {
        configurable: !0,
        get() {
          return a || n;
        },
      });
      var u = V,
        f = H;
      (Yn(null), Xn(null));
      try {
        for (var p, m = []; a !== null && a !== t; ) {
          try {
            var h = a[vr]?.[r];
            h != null && (!a.disabled || e.target === a) && h.call(a, e);
          } catch (e) {
            p ? m.push(e) : (p = e);
          }
          if (e.cancelBubble) break;
          (o++, (a = o < i.length ? i[o] : null));
        }
        if (p) {
          for (let e of m)
            queueMicrotask(() => {
              throw e;
            });
          throw p;
        }
      } finally {
        ((e[vr] = t), delete e.currentTarget, Yn(u), Xn(f));
      }
    }
  }
  var Tr =
    globalThis?.window?.trustedTypes &&
    globalThis.window.trustedTypes.createPolicy(`svelte-trusted-html`, {
      createHTML: (e) => e,
    });
  function Er(e) {
    return Tr?.createHTML(e) ?? e;
  }
  function Dr(e) {
    var t = dn(`template`);
    return ((t.innerHTML = Er(e.replaceAll(`<!>`, `<!---->`))), t.content);
  }
  function Or(e, t) {
    var n = H;
    n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
  }
  function W(e, t) {
    var n = (t & 1) != 0,
      r = (t & 2) != 0,
      i,
      a = !e.startsWith(`<!>`);
    return () => {
      if (k) return (Or(A, null), A);
      i === void 0 && ((i = Dr(a ? e : `<!>` + e)), n || (i = sn(i)));
      var t = r || tn ? document.importNode(i, !0) : i.cloneNode(!0);
      if (n) {
        var o = sn(t),
          s = t.lastChild;
        Or(o, s);
      } else Or(t, t);
      return t;
    };
  }
  function G(e, t) {
    if (k) {
      var n = H;
      ((!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = A), Pe());
      return;
    }
    e !== null && e.before(t);
  }
  [
    ...`allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback`.split(
      `.`,
    ),
  ];
  var kr = [`touchstart`, `touchmove`];
  function Ar(e) {
    return kr.includes(e);
  }
  function jr(e, t) {
    var n = t == null ? `` : typeof t == `object` ? `${t}` : t;
    n !== (e[ge] ??= e.nodeValue) && ((e[ge] = n), (e.nodeValue = `${n}`));
  }
  function Mr(e, t) {
    return Fr(e, t);
  }
  function Nr(e, n) {
    (an(), (n.intro = n.intro ?? !1));
    let r = n.target,
      i = k,
      a = A;
    try {
      for (var o = sn(r); o && (o.nodeType !== 8 || o.data !== `[`); )
        o = cn(o);
      if (!o) throw t;
      (Ne(!0), j(o));
      let i = Fr(e, { ...n, anchor: o });
      return (Ne(!1), i);
    } catch (i) {
      if (
        i instanceof Error &&
        i.message
          .split(
            `
`,
          )
          .some((e) => e.startsWith(`https://svelte.dev/e/`))
      )
        throw i;
      return (
        i !== t && console.warn(`Failed to hydrate: `, i),
        n.recover === !1 && we(),
        an(),
        ln(r),
        Ne(!1),
        Mr(e, n)
      );
    } finally {
      (Ne(i), j(a));
    }
  }
  var Pr = new Map();
  function Fr(
    e,
    {
      target: n,
      anchor: r,
      props: i = {},
      events: a,
      context: o,
      intro: s = !0,
      transformError: c,
    },
  ) {
    an();
    var u = void 0,
      d = En(() => {
        var s = r ?? n.appendChild(on());
        st(
          s,
          { pending: () => {} },
          (n) => {
            We({});
            var r = N;
            if (
              (o && (r.c = o),
              a && (i.$$events = a),
              k && Or(n, null),
              (u = e(n, i) || {}),
              k &&
                ((H.nodes.end = A),
                A === null || A.nodeType !== 8 || A.data !== `]`))
            )
              throw (je(), t);
            Ge();
          },
          c,
        );
        var d = new Set(),
          f = (e) => {
            for (var t = 0; t < e.length; t++) {
              var r = e[t];
              if (!d.has(r)) {
                d.add(r);
                var i = Ar(r);
                for (let e of [n, document]) {
                  var a = Pr.get(e);
                  a === void 0 && ((a = new Map()), Pr.set(e, a));
                  var o = a.get(r);
                  o === void 0
                    ? (e.addEventListener(r, wr, { passive: i }), a.set(r, 1))
                    : a.set(r, o + 1);
                }
              }
            }
          };
        return (
          f(l(yr)),
          br.add(f),
          () => {
            for (var e of d)
              for (let r of [n, document]) {
                var t = Pr.get(r),
                  i = t.get(e);
                --i == 0
                  ? (r.removeEventListener(e, wr),
                    t.delete(e),
                    t.size === 0 && Pr.delete(r))
                  : t.set(e, i);
              }
            (br.delete(f), s !== r && s.parentNode?.removeChild(s));
          }
        );
      });
    return (Ir.set(u, d), u);
  }
  var Ir = new WeakMap();
  function Lr(e, t) {
    let n = Ir.get(e);
    return n ? (Ir.delete(e), n(t)) : Promise.resolve();
  }
  var Rr = class {
    anchor;
    #e = new Map();
    #t = new Map();
    #n = new Map();
    #r = new Set();
    #i = !0;
    constructor(e, t = !0) {
      ((this.anchor = e), (this.#i = t));
    }
    #a = (e) => {
      if (this.#e.has(e)) {
        var t = this.#e.get(e),
          n = this.#t.get(t);
        if (n) (Vn(n), this.#r.delete(t));
        else {
          var r = this.#n.get(t);
          r &&
            (Vn(r.effect),
            this.#t.set(t, r.effect),
            this.#n.delete(t),
            r.fragment.lastChild.remove(),
            this.anchor.before(r.fragment),
            (n = r.effect));
        }
        for (let [t, n] of this.#e) {
          if ((this.#e.delete(t), t === e)) break;
          let r = this.#n.get(n);
          r && (In(r.effect), this.#n.delete(n));
        }
        for (let [e, r] of this.#t) {
          if (e === t || this.#r.has(e)) continue;
          let i = () => {
            if (Array.from(this.#e.values()).includes(e)) {
              var t = document.createDocumentFragment();
              (Un(r, t),
                t.append(on()),
                this.#n.set(e, { effect: r, fragment: t }));
            } else In(r);
            (this.#r.delete(e), this.#t.delete(e));
          };
          this.#i || !n ? (this.#r.add(e), zn(r, i, !1)) : i();
        }
      }
    };
    #o = (e) => {
      this.#e.delete(e);
      let t = Array.from(this.#e.values());
      for (let [e, n] of this.#n)
        t.includes(e) || (In(n.effect), this.#n.delete(e));
    };
    ensure(e, t) {
      var n = I,
        r = un();
      if (t && !this.#t.has(e) && !this.#n.has(e))
        if (r) {
          var i = document.createDocumentFragment(),
            a = on();
          (i.append(a),
            this.#n.set(e, { effect: Mn(() => t(a)), fragment: i }));
        } else
          this.#t.set(
            e,
            Mn(() => t(this.anchor)),
          );
      if ((this.#e.set(n, e), r)) {
        for (let [t, r] of this.#t)
          t === e ? n.unskip_effect(r) : n.skip_effect(r);
        for (let [t, r] of this.#n)
          t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
        (n.oncommit(this.#a), n.ondiscard(this.#o));
      } else (k && (this.anchor = A), this.#a(n));
    }
  };
  function zr(e) {
    (N === null && E(`onMount`),
      He && N.l !== null
        ? Br(N).m.push(e)
        : Cn(() => {
            let t = _r(e);
            if (typeof t == `function`) return t;
          }));
  }
  function Br(e) {
    var t = e.l;
    return (t.u ??= { a: [], b: [], m: [] });
  }
  function Vr(e, t, n = !1) {
    var r;
    k && ((r = A), Pe());
    var i = new Rr(e),
      a = n ? re : 0;
    function o(e, t) {
      if (k) {
        var n = Le(r);
        if (e !== parseInt(n.substring(1))) {
          var a = Ie();
          (j(a), (i.anchor = a), Ne(!1), i.ensure(e, t), Ne(!0));
          return;
        }
      }
      i.ensure(e, t);
    }
    jn(() => {
      var e = !1;
      (t((t, n = 0) => {
        ((e = !0), o(n, t));
      }),
        e || o(-1, null));
    }, a);
  }
  function Hr(e, t) {
    return t;
  }
  function Ur(e, t, n) {
    for (var r = [], i = t.length, a, o = t.length, s = 0; s < i; s++) {
      let n = t[s];
      zn(
        n,
        () => {
          if (a) {
            if ((a.pending.delete(n), a.done.add(n), a.pending.size === 0)) {
              var t = e.outrogroups;
              (Wr(e, l(a.done)),
                t.delete(a),
                t.size === 0 && (e.outrogroups = null));
            }
          } else --o;
        },
        !1,
      );
    }
    if (o === 0) {
      var c = r.length === 0 && n !== null;
      if (c) {
        var u = n,
          d = u.parentNode;
        (ln(d), d.append(u), e.items.clear());
      }
      Wr(e, t, !c);
    } else
      ((a = { pending: new Set(t), done: new Set() }),
        (e.outrogroups ??= new Set()).add(a));
  }
  function Wr(e, t, n = !0) {
    var r;
    if (e.pending.size > 0) {
      r = new Set();
      for (let t of e.pending.values())
        for (let n of t) r.add(e.items.get(n).e);
    }
    for (var i = 0; i < t.length; i++) {
      var a = t[i];
      r?.has(a)
        ? ((a.f |= oe), Un(a, document.createDocumentFragment()))
        : In(t[i], n);
    }
  }
  var Gr;
  function Kr(e, t, n, r, i, a = null) {
    var s = e,
      c = new Map();
    if (t & 4) {
      var u = e;
      s = k ? j(sn(u)) : u.appendChild(on());
    }
    k && Pe();
    var d = null,
      f = _t(() => {
        var e = n();
        return o(e) ? e : e == null ? [] : l(e);
      }),
      p,
      m = new Map(),
      h = !0;
    function g(e) {
      v.effect.f & 16384 ||
        (v.pending.delete(e),
        (v.fallback = d),
        Jr(v, p, s, t, r),
        d !== null &&
          (p.length === 0
            ? d.f & 33554432
              ? ((d.f ^= oe), Xr(d, null, s))
              : Vn(d)
            : zn(d, () => {
                d = null;
              })));
    }
    function _(e) {
      v.pending.delete(e);
    }
    var v = {
      effect: jn(() => {
        p = U(f);
        var e = p.length;
        let o = !1;
        k &&
          (Le(s) === `[!`) != (e === 0) &&
          ((s = Ie()), j(s), Ne(!1), (o = !0));
        for (var l = new Set(), u = I, v = un(), y = 0; y < e; y += 1) {
          k &&
            A.nodeType === 8 &&
            A.data === `]` &&
            ((s = A), (o = !0), Ne(!1));
          var b = p[y],
            x = r(b, y),
            S = h ? null : c.get(x);
          (S
            ? (S.v && Yt(S.v, b), S.i && Yt(S.i, y), v && u.unskip_effect(S.e))
            : ((S = Yr(c, h ? s : (Gr ??= on()), b, x, y, i, t, n)),
              h || (S.e.f |= oe),
              c.set(x, S)),
            l.add(x));
        }
        if (
          (e === 0 &&
            a &&
            !d &&
            (h
              ? (d = Mn(() => a(s)))
              : ((d = Mn(() => a((Gr ??= on())))), (d.f |= oe))),
          e > l.size && D(``, ``, ``),
          k && e > 0 && j(Ie()),
          !h)
        )
          if ((m.set(u, l), v)) {
            for (let [e, t] of c) l.has(e) || u.skip_effect(t.e);
            (u.oncommit(g), u.ondiscard(_));
          } else g(u);
        (o && Ne(!0), U(f));
      }),
      flags: t,
      items: c,
      pending: m,
      outrogroups: null,
      fallback: d,
    };
    ((h = !1), k && (s = A));
  }
  function qr(e) {
    for (; e !== null && !(e.f & 32); ) e = e.next;
    return e;
  }
  function Jr(e, t, n, r, i) {
    var a = (r & 8) != 0,
      o = t.length,
      s = e.items,
      c = qr(e.effect.first),
      u,
      d = null,
      f,
      p = [],
      m = [],
      h,
      g,
      _,
      v;
    if (a)
      for (v = 0; v < o; v += 1)
        ((h = t[v]),
          (g = i(h, v)),
          (_ = s.get(g).e),
          _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= new Set()).add(_)));
    for (v = 0; v < o; v += 1) {
      if (((h = t[v]), (g = i(h, v)), (_ = s.get(g).e), e.outrogroups !== null))
        for (let t of e.outrogroups) (t.pending.delete(_), t.done.delete(_));
      if (
        (_.f & 8192 &&
          (Vn(_), a && (_.nodes?.a?.unfix(), (f ??= new Set()).delete(_))),
        _.f & 33554432)
      )
        if (((_.f ^= oe), _ === c)) Xr(_, null, n);
        else {
          var y = d ? d.next : c;
          (_ === e.effect.last && (e.effect.last = _.prev),
            _.prev && (_.prev.next = _.next),
            _.next && (_.next.prev = _.prev),
            Zr(e, d, _),
            Zr(e, _, y),
            Xr(_, y, n),
            (d = _),
            (p = []),
            (m = []),
            (c = qr(d.next)));
          continue;
        }
      if (_ !== c) {
        if (u !== void 0 && u.has(_)) {
          if (p.length < m.length) {
            var b = m[0],
              x;
            d = b.prev;
            var S = p[0],
              C = p[p.length - 1];
            for (x = 0; x < p.length; x += 1) Xr(p[x], b, n);
            for (x = 0; x < m.length; x += 1) u.delete(m[x]);
            (Zr(e, S.prev, C.next),
              Zr(e, d, S),
              Zr(e, C, b),
              (c = b),
              (d = C),
              --v,
              (p = []),
              (m = []));
          } else
            (u.delete(_),
              Xr(_, c, n),
              Zr(e, _.prev, _.next),
              Zr(e, _, d === null ? e.effect.first : d.next),
              Zr(e, d, _),
              (d = _));
          continue;
        }
        for (p = [], m = []; c !== null && c !== _; )
          ((u ??= new Set()).add(c), m.push(c), (c = qr(c.next)));
        if (c === null) continue;
      }
      (_.f & 33554432 || p.push(_), (d = _), (c = qr(_.next)));
    }
    if (e.outrogroups !== null) {
      for (let t of e.outrogroups)
        t.pending.size === 0 && (Wr(e, l(t.done)), e.outrogroups?.delete(t));
      e.outrogroups.size === 0 && (e.outrogroups = null);
    }
    if (c !== null || u !== void 0) {
      var ee = [];
      if (u !== void 0) for (_ of u) _.f & 8192 || ee.push(_);
      for (; c !== null; )
        (!(c.f & 8192) && c !== e.fallback && ee.push(c), (c = qr(c.next)));
      var w = ee.length;
      if (w > 0) {
        var te = r & 4 && o === 0 ? n : null;
        if (a) {
          for (v = 0; v < w; v += 1) ee[v].nodes?.a?.measure();
          for (v = 0; v < w; v += 1) ee[v].nodes?.a?.fix();
        }
        Ur(e, ee, te);
      }
    }
    a &&
      Ye(() => {
        if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
      });
  }
  function Yr(e, t, n, r, i, a, o, s) {
    var c = o & 1 ? (o & 16 ? qt(n) : Jt(n, !1, !1)) : null,
      l = o & 2 ? qt(i) : null;
    return {
      v: c,
      i: l,
      e: Mn(
        () => (
          a(t, c ?? n, l ?? i, s),
          () => {
            e.delete(r);
          }
        ),
      ),
    };
  }
  function Xr(e, t, n) {
    if (e.nodes)
      for (
        var r = e.nodes.start,
          i = e.nodes.end,
          a = t && !(t.f & 33554432) ? t.nodes.start : n;
        r !== null;
      ) {
        var o = cn(r);
        if ((a.before(r), r === i)) return;
        r = o;
      }
  }
  function Zr(e, t, n) {
    (t === null ? (e.effect.first = n) : (t.next = n),
      n === null ? (e.effect.last = t) : (n.prev = t));
  }
  function Qr(e, n, r = !1, o = !1, s = !1, c = !1) {
    var l = e,
      u = ``;
    if (r) {
      var d = e;
      k && (l = j(sn(d)));
    }
    An(() => {
      var e = H;
      if (u === (u = n() ?? ``)) {
        k && Pe();
        return;
      }
      if (r && !k) {
        ((e.nodes = null),
          (d.innerHTML = u),
          u !== `` && Or(sn(d), d.lastChild));
        return;
      }
      if (
        (e.nodes !== null && (Ln(e.nodes.start, e.nodes.end), (e.nodes = null)),
        u !== ``)
      ) {
        if (k) {
          for (
            var c = A.data, f = Pe(), p = f;
            f !== null && (f.nodeType !== 8 || f.data !== ``);
          )
            ((p = f), (f = cn(f)));
          if (f === null) throw (je(), t);
          (Or(A, p), (l = j(f)));
          return;
        }
        var m = dn(o ? `svg` : s ? `math` : `template`, o ? i : s ? a : void 0);
        m.innerHTML = u;
        var h = o || s ? m : m.content;
        if ((Or(sn(h), h.lastChild), o || s)) for (; sn(h); ) l.before(sn(h));
        else l.before(h);
      }
    });
  }
  function $r(e, t) {
    Dn(() => {
      var n = e.getRootNode(),
        r = n.host ? n : (n.head ?? n.ownerDocument.head);
      if (!r.querySelector(`#` + t.hash)) {
        let e = dn(`style`);
        ((e.id = t.hash), (e.textContent = t.code), r.appendChild(e));
      }
    });
  }
  var ei = [
    ...` 	
\r\f\xA0\v﻿`,
  ];
  function ti(e, t, n) {
    var r = e == null ? `` : `` + e;
    if ((t && (r = r ? r + ` ` + t : t), n)) {
      for (var i of Object.keys(n))
        if (n[i]) r = r ? r + ` ` + i : i;
        else if (r.length)
          for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0; ) {
            var s = o + a;
            (o === 0 || ei.includes(r[o - 1])) &&
            (s === r.length || ei.includes(r[s]))
              ? (r = (o === 0 ? `` : r.substring(0, o)) + r.substring(s + 1))
              : (o = s);
          }
    }
    return r === `` ? null : r;
  }
  function ni(e, t = !1) {
    var n = t ? ` !important;` : `;`,
      r = ``;
    for (var i of Object.keys(e)) {
      var a = e[i];
      a != null && a !== `` && (r += ` ` + i + `: ` + a + n);
    }
    return r;
  }
  function ri(e) {
    return e[0] !== `-` || e[1] !== `-` ? e.toLowerCase() : e;
  }
  function ii(e, t) {
    if (t) {
      var n = ``,
        r,
        i;
      if ((Array.isArray(t) ? ((r = t[0]), (i = t[1])) : (r = t), e)) {
        e = String(e)
          .replaceAll(/\s*\/\*.*?\*\/\s*/g, ``)
          .trim();
        var a = !1,
          o = 0,
          s = !1,
          c = [];
        (r && c.push(...Object.keys(r).map(ri)),
          i && c.push(...Object.keys(i).map(ri)));
        var l = 0,
          u = -1;
        let t = e.length;
        for (var d = 0; d < t; d++) {
          var f = e[d];
          if (
            (s
              ? f === `/` && e[d - 1] === `*` && (s = !1)
              : a
                ? a === f && (a = !1)
                : f === `/` && e[d + 1] === `*`
                  ? (s = !0)
                  : f === `"` || f === `'`
                    ? (a = f)
                    : f === `(`
                      ? o++
                      : f === `)` && o--,
            !s && a === !1 && o === 0)
          ) {
            if (f === `:` && u === -1) u = d;
            else if (f === `;` || d === t - 1) {
              if (u !== -1) {
                var p = ri(e.substring(l, u).trim());
                if (!c.includes(p)) {
                  f !== `;` && d++;
                  var m = e.substring(l, d).trim();
                  n += ` ` + m + `;`;
                }
              }
              ((l = d + 1), (u = -1));
            }
          }
        }
      }
      return (
        r && (n += ni(r)),
        i && (n += ni(i, !0)),
        (n = n.trim()),
        n === `` ? null : n
      );
    }
    return e == null ? null : String(e);
  }
  function ai(e, t, n, r, i, a) {
    var o = e[me];
    if (k || o !== n || o === void 0) {
      var s = ti(n, r, a);
      ((!k || s !== e.getAttribute(`class`)) &&
        (s == null
          ? e.removeAttribute(`class`)
          : t
            ? (e.className = s)
            : e.setAttribute(`class`, s)),
        (e[me] = n));
    } else if (a && i !== a)
      for (var c in a) {
        var l = !!a[c];
        (i == null || l !== !!i[c]) && e.classList.toggle(c, l);
      }
    return a;
  }
  function oi(e, t = {}, n, r) {
    for (var i in n) {
      var a = n[i];
      t[i] !== a &&
        (n[i] == null
          ? e.style.removeProperty(i)
          : e.style.setProperty(i, a, r));
    }
  }
  function si(e, t, n, r) {
    var i = e[he];
    if (k || i !== t) {
      var a = ii(t, r);
      ((!k || a !== e.getAttribute(`style`)) &&
        (a == null ? e.removeAttribute(`style`) : (e.style.cssText = a)),
        (e[he] = t));
    } else
      r &&
        (Array.isArray(r)
          ? (oi(e, n?.[0], r[0]), oi(e, n?.[1], r[1], `important`))
          : oi(e, n, r));
    return r;
  }
  var ci = Symbol(`is custom element`),
    li = Symbol(`is html`),
    ui = ye ? `link` : `LINK`;
  function di(e, t, n, r) {
    var i = fi(e);
    (k &&
      ((i[t] = e.getAttribute(t)),
      t === `src` || t === `srcset` || (t === `href` && e.nodeName === ui))) ||
      (i[t] !== (i[t] = n) &&
        (t === `loading` && (e[fe] = n),
        n == null
          ? e.removeAttribute(t)
          : typeof n != `string` && mi(e).includes(t)
            ? (e[t] = n)
            : e.setAttribute(t, n)));
  }
  function fi(e) {
    return (e[pe] ??= {
      [ci]: e.nodeName.includes(`-`),
      [li]: e.namespaceURI === r,
    });
  }
  var pi = new Map();
  function mi(e) {
    var t = e.getAttribute(`is`) || e.nodeName,
      n = pi.get(t);
    if (n) return n;
    pi.set(t, (n = []));
    for (var r, i = e, a = Element.prototype; a !== i; ) {
      for (var o in ((r = p(i)), r))
        r[o].set &&
          o !== `innerHTML` &&
          o !== `textContent` &&
          o !== `innerText` &&
          n.push(o);
      i = g(i);
    }
    return n;
  }
  function hi(e, t, n = t) {
    var r = new WeakSet();
    (_n(e, `input`, async (i) => {
      var a = i ? e.defaultValue : e.value;
      if (
        ((a = gi(e) ? _i(a) : a),
        n(a),
        I !== null && r.add(I),
        await mr(),
        a !== (a = t()))
      ) {
        var o = e.selectionStart,
          s = e.selectionEnd,
          c = e.value.length;
        if (((e.value = a ?? ``), s !== null)) {
          var l = e.value.length;
          o === s && s === c && l > c
            ? ((e.selectionStart = l), (e.selectionEnd = l))
            : ((e.selectionStart = o), (e.selectionEnd = Math.min(s, l)));
        }
      }
    }),
      ((k && e.defaultValue !== e.value) || (_r(t) == null && e.value)) &&
        (n(gi(e) ? _i(e.value) : e.value), I !== null && r.add(I)),
      kn(() => {
        var n = t();
        if (e === document.activeElement) {
          var i = Ve ? Tt : I;
          if (r.has(i)) return;
        }
        (gi(e) && n === _i(e.value)) ||
          (e.type === `date` && !n && !e.value) ||
          (n !== e.value && (e.value = n ?? ``));
      }));
  }
  function gi(e) {
    var t = e.type;
    return t === `number` || t === `range`;
  }
  function _i(e) {
    return e === `` ? null : +e;
  }
  function vi(e, t) {
    return e === t || e?.[T] === t;
  }
  function yi(e = {}, t, n, r) {
    var i = N.r,
      a = H;
    return (
      Dn(() => {
        var o, s;
        return (
          kn(() => {
            ((o = s),
              (s = r?.() || []),
              _r(() => {
                vi(n(...s), e) ||
                  (t(e, ...s), o && vi(n(...o), e) && t(null, ...o));
              }));
          }),
          () => {
            let r = a;
            for (; r !== i && r.parent !== null && r.parent.f & 33554432; )
              r = r.parent;
            let o = () => {
                s && vi(n(...s), e) && t(null, ...s);
              },
              c = r.teardown;
            r.teardown = () => {
              (o(), c?.());
            };
          }
        );
      }),
      e
    );
  }
  function bi(e, t, n, r) {
    var i = !He || (n & 2) != 0,
      a = (n & 8) != 0,
      o = (n & 16) != 0,
      s = r,
      c = !0,
      l = void 0,
      u = () =>
        o && i
          ? ((l ??= pt(r)), U(l))
          : (c && ((c = !1), (s = o ? _r(r) : r)), s);
    let d;
    if (a) {
      var p = T in e || de in e;
      d = f(e, t)?.set ?? (p && t in e ? (n) => (e[t] = n) : void 0);
    }
    var m,
      h = !1;
    (a ? ([m, h] = it(() => e[t])) : (m = e[t]),
      m === void 0 && r !== void 0 && ((m = u()), d && (i && Te(t), d(m))));
    var g = i
      ? () => {
          var n = e[t];
          return n === void 0 ? u() : ((c = !0), n);
        }
      : () => {
          var n = e[t];
          return (n !== void 0 && (s = void 0), n === void 0 ? s : n);
        };
    if (i && !(n & 4)) return g;
    if (d) {
      var _ = e.$$legacy;
      return function (e, t) {
        return arguments.length > 0
          ? ((!i || !t || _ || h) && d(t ? g() : e), e)
          : g();
      };
    }
    var v = !1,
      y = (n & 1 ? pt : _t)(() => ((v = !1), g()));
    a && U(y);
    var b = H;
    return function (e, t) {
      if (arguments.length > 0) {
        let n = t ? U(y) : i && a ? $t(e) : e;
        return (R(y, n), (v = !0), s !== void 0 && (s = n), e);
      }
      return (Kn && v) || b.f & 16384 ? y.v : U(y);
    };
  }
  function xi(e) {
    return new Si(e);
  }
  var Si = class {
      #e;
      #t;
      constructor(e) {
        var t = new Map(),
          n = (e, n) => {
            var r = Jt(n, !1, !1);
            return (t.set(e, r), r);
          };
        let r = new Proxy(
          { ...(e.props || {}), $$events: {} },
          {
            get(e, r) {
              return U(t.get(r) ?? n(r, Reflect.get(e, r)));
            },
            has(e, r) {
              return r === de
                ? !0
                : (U(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
            },
            set(e, r, i) {
              return (R(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i));
            },
          },
        );
        ((this.#t = (e.hydrate ? Nr : Mr)(e.component, {
          target: e.target,
          anchor: e.anchor,
          props: r,
          context: e.context,
          intro: e.intro ?? !1,
          recover: e.recover,
          transformError: e.transformError,
        })),
          !Ve && (!e?.props?.$$host || e.sync === !1) && Ft(),
          (this.#e = r.$$events));
        for (let e of Object.keys(this.#t))
          e === `$set` ||
            e === `$destroy` ||
            e === `$on` ||
            d(this, e, {
              get() {
                return this.#t[e];
              },
              set(t) {
                this.#t[e] = t;
              },
              enumerable: !0,
            });
        ((this.#t.$set = (e) => {
          Object.assign(r, e);
        }),
          (this.#t.$destroy = () => {
            Lr(this.#t);
          }));
      }
      $set(e) {
        this.#t.$set(e);
      }
      $on(e, t) {
        this.#e[e] = this.#e[e] || [];
        let n = (...e) => t.call(this, ...e);
        return (
          this.#e[e].push(n),
          () => {
            this.#e[e] = this.#e[e].filter((e) => e !== n);
          }
        );
      }
      $destroy() {
        this.#t.$destroy();
      }
    },
    Ci;
  typeof HTMLElement == `function` &&
    (Ci = class extends HTMLElement {
      $$ctor;
      $$s;
      $$c;
      $$cn = !1;
      $$d = {};
      $$r = !1;
      $$p_d = {};
      $$l = {};
      $$l_u = new Map();
      $$me;
      $$shadowRoot = null;
      constructor(e, t, n) {
        (super(),
          (this.$$ctor = e),
          (this.$$s = t),
          n && (this.$$shadowRoot = this.attachShadow(n)));
      }
      addEventListener(e, t, n) {
        if (
          ((this.$$l[e] = this.$$l[e] || []), this.$$l[e].push(t), this.$$c)
        ) {
          let n = this.$$c.$on(e, t);
          this.$$l_u.set(t, n);
        }
        super.addEventListener(e, t, n);
      }
      removeEventListener(e, t, n) {
        if ((super.removeEventListener(e, t, n), this.$$c)) {
          let e = this.$$l_u.get(t);
          e && (e(), this.$$l_u.delete(t));
        }
      }
      async connectedCallback() {
        if (((this.$$cn = !0), !this.$$c)) {
          if ((await Promise.resolve(), !this.$$cn || this.$$c)) return;
          function e(e) {
            return (t) => {
              let n = dn(`slot`);
              (e !== "default" && (n.name = e), G(t, n));
            };
          }
          let t = {},
            n = Ti(this);
          for (let r of this.$$s)
            r in n &&
              (r === "default" && !this.$$d.children
                ? ((this.$$d.children = e(r)), (t.default = !0))
                : (t[r] = e(r)));
          for (let e of this.attributes) {
            let t = this.$$g_p(e.name);
            t in this.$$d ||
              (this.$$d[t] = wi(t, e.value, this.$$p_d, `toProp`));
          }
          for (let e in this.$$p_d)
            !(e in this.$$d) &&
              this[e] !== void 0 &&
              ((this.$$d[e] = this[e]), delete this[e]);
          ((this.$$c = xi({
            component: this.$$ctor,
            target: this.$$shadowRoot || this,
            props: { ...this.$$d, $$slots: t, $$host: this },
          })),
            (this.$$me = Tn(() => {
              kn(() => {
                this.$$r = !0;
                for (let e of u(this.$$c)) {
                  if (!this.$$p_d[e]?.reflect) continue;
                  this.$$d[e] = this.$$c[e];
                  let t = wi(e, this.$$d[e], this.$$p_d, `toAttribute`);
                  t == null
                    ? this.removeAttribute(this.$$p_d[e].attribute || e)
                    : this.setAttribute(this.$$p_d[e].attribute || e, t);
                }
                this.$$r = !1;
              });
            })));
          for (let e in this.$$l)
            for (let t of this.$$l[e]) {
              let n = this.$$c.$on(e, t);
              this.$$l_u.set(t, n);
            }
          this.$$l = {};
        }
      }
      attributeChangedCallback(e, t, n) {
        this.$$r ||
          ((e = this.$$g_p(e)),
          (this.$$d[e] = wi(e, n, this.$$p_d, `toProp`)),
          this.$$c?.$set({ [e]: this.$$d[e] }));
      }
      disconnectedCallback() {
        ((this.$$cn = !1),
          Promise.resolve().then(() => {
            !this.$$cn &&
              this.$$c &&
              (this.$$c.$destroy(), this.$$me(), (this.$$c = void 0));
          }));
      }
      $$g_p(e) {
        return (
          u(this.$$p_d).find(
            (t) =>
              this.$$p_d[t].attribute === e ||
              (!this.$$p_d[t].attribute && t.toLowerCase() === e),
          ) || e
        );
      }
    });
  function wi(e, t, n, r) {
    let i = n[e]?.type;
    if (
      ((t = i === `Boolean` && typeof t != `boolean` ? t != null : t),
      !r || !n[e])
    )
      return t;
    if (r === `toAttribute`)
      switch (i) {
        case `Object`:
        case `Array`:
          return t == null ? null : JSON.stringify(t);
        case `Boolean`:
          return t ? `` : null;
        case `Number`:
          return t ?? null;
        default:
          return t;
      }
    else
      switch (i) {
        case `Object`:
        case `Array`:
          return t && JSON.parse(t);
        case `Boolean`:
          return t;
        case `Number`:
          return t == null ? t : +t;
        default:
          return t;
      }
  }
  function Ti(e) {
    let t = {};
    return (
      e.childNodes.forEach((e) => {
        t[e.slot || `default`] = !0;
      }),
      t
    );
  }
  function Ei(e, t, n, r, i, a) {
    let o = class extends Ci {
      constructor() {
        (super(e, n, i), (this.$$p_d = t));
      }
      static get observedAttributes() {
        return u(t).map((e) => (t[e].attribute || e).toLowerCase());
      }
    };
    return (
      u(t).forEach((e) => {
        d(o.prototype, e, {
          get() {
            return this.$$c && e in this.$$c ? this.$$c[e] : this.$$d[e];
          },
          set(n) {
            ((n = wi(e, n, t)), (this.$$d[e] = n));
            var r = this.$$c;
            r && (f(r, e)?.get ? (r[e] = n) : r.$set({ [e]: n }));
          },
        });
      }),
      r.forEach((e) => {
        d(o.prototype, e, {
          get() {
            return this.$$c?.[e];
          },
        });
      }),
      a && (o = a(o)),
      (e.element = o),
      o
    );
  }
  function Di() {
    return {
      async: !1,
      breaks: !1,
      extensions: null,
      gfm: !0,
      hooks: null,
      pedantic: !1,
      renderer: null,
      silent: !1,
      tokenizer: null,
      walkTokens: null,
    };
  }
  var Oi = Di();
  function ki(e) {
    Oi = e;
  }
  var Ai = { exec: () => null };
  function ji(e) {
    let t = [];
    return (n) => {
      let r = Math.max(0, Math.min(3, n - 1)),
        i = t[r];
      return (i || ((i = e(r)), (t[r] = i)), i);
    };
  }
  function K(e, t = ``) {
    let n = typeof e == `string` ? e : e.source,
      r = {
        replace: (e, t) => {
          let i = typeof t == `string` ? t : t.source;
          return ((i = i.replace(q.caret, `$1`)), (n = n.replace(e, i)), r);
        },
        getRegex: () => new RegExp(n, t),
      };
    return r;
  }
  var Mi = ((e = ``) => {
      try {
        return !!RegExp(`(?<=1)(?<!1)` + e);
      } catch {
        return !1;
      }
    })(),
    q = {
      codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
      outputLinkReplace: /\\([\[\]])/g,
      indentCodeCompensation: /^(\s+)(?:```)/,
      beginningSpace: /^\s+/,
      endingHash: /#$/,
      startingSpaceChar: /^ /,
      endingSpaceChar: / $/,
      nonSpaceChar: /[^ ]/,
      newLineCharGlobal: /\n/g,
      tabCharGlobal: /\t/g,
      multipleSpaceGlobal: /\s+/g,
      blankLine: /^[ \t]*$/,
      doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
      blockquoteStart: /^ {0,3}>/,
      blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
      blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
      listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
      listIsTask: /^\[[ xX]\] +\S/,
      listReplaceTask: /^\[[ xX]\] +/,
      listTaskCheckbox: /\[[ xX]\]/,
      anyLine: /\n.*\n/,
      hrefBrackets: /^<(.*)>$/,
      tableDelimiter: /[:|]/,
      tableAlignChars: /^\||\| *$/g,
      tableRowBlankLine: /\n[ \t]*$/,
      tableAlignRight: /^ *-+: *$/,
      tableAlignCenter: /^ *:-+: *$/,
      tableAlignLeft: /^ *:-+ *$/,
      startATag: /^<a /i,
      endATag: /^<\/a>/i,
      startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
      endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
      startAngleBracket: /^</,
      endAngleBracket: />$/,
      pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
      unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
      escapeTest: /[&<>"']/,
      escapeReplace: /[&<>"']/g,
      escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
      escapeReplaceNoEncode:
        /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
      caret: /(^|[^\[])\^/g,
      percentDecode: /%25/g,
      findPipe: /\|/g,
      splitPipe: / \|/,
      slashPipe: /\\\|/g,
      carriageReturn: /\r\n|\r/g,
      spaceLine: /^ +$/gm,
      notSpaceStart: /^\S*/,
      endingNewline: /\n$/,
      listItemRegex: (e) => RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
      nextBulletRegex: ji((e) =>
        RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
      ),
      hrRegex: ji((e) =>
        RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
      ),
      fencesBeginRegex: ji((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
      headingBeginRegex: ji((e) => RegExp(`^ {0,${e}}#`)),
      htmlBeginRegex: ji((e) => RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`, `i`)),
      blockquoteBeginRegex: ji((e) => RegExp(`^ {0,${e}}>`)),
    },
    Ni = /^(?:[ \t]*(?:\n|$))+/,
    Pi = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,
    Fi =
      /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
    Ii = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
    Li = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
    Ri = / {0,3}(?:[*+-]|\d{1,9}[.)])/,
    zi =
      /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    Bi = K(zi)
      .replace(/bull/g, Ri)
      .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
      .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
      .replace(/blockquote/g, / {0,3}>/)
      .replace(/heading/g, / {0,3}#{1,6}/)
      .replace(/html/g, / {0,3}<[^\n>]+>\n/)
      .replace(/\|table/g, ``)
      .getRegex(),
    Vi = K(zi)
      .replace(/bull/g, Ri)
      .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
      .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
      .replace(/blockquote/g, / {0,3}>/)
      .replace(/heading/g, / {0,3}#{1,6}/)
      .replace(/html/g, / {0,3}<[^\n>]+>\n/)
      .replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/)
      .getRegex(),
    Hi =
      /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
    Ui = /^[^\n]+/,
    Wi = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,
    Gi = K(
      /^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/,
    )
      .replace(`label`, Wi)
      .replace(
        `title`,
        /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
      )
      .getRegex(),
    Ki = K(/^(bull)([ \t][^\n]*?)?(?:\n|$)/)
      .replace(/bull/g, Ri)
      .getRegex(),
    qi = `address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,
    Ji = /<!--(?:-?>|[\s\S]*?(?:-->|$))/,
    Yi = K(
      `^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))`,
      `i`,
    )
      .replace(`comment`, Ji)
      .replace(`tag`, qi)
      .replace(
        `attribute`,
        / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/,
      )
      .getRegex(),
    Xi = K(Hi)
      .replace(`hr`, Ii)
      .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
      .replace(`|lheading`, ``)
      .replace(`|table`, ``)
      .replace(`blockquote`, ` {0,3}>`)
      .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
      .replace(`list`, ` {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]`)
      .replace(
        `html`,
        `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
      )
      .replace(`tag`, qi)
      .getRegex(),
    Zi = {
      blockquote: K(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/)
        .replace(`paragraph`, Xi)
        .getRegex(),
      code: Pi,
      def: Gi,
      fences: Fi,
      heading: Li,
      hr: Ii,
      html: Yi,
      lheading: Bi,
      list: Ki,
      newline: Ni,
      paragraph: Xi,
      table: Ai,
      text: Ui,
    },
    Qi = K(
      `^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)`,
    )
      .replace(`hr`, Ii)
      .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
      .replace(`blockquote`, ` {0,3}>`)
      .replace(`code`, `(?: {4}| {0,3}	)[^\\n]`)
      .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
      .replace(`list`, ` {0,3}(?:[*+-]|1[.)])[ \\t]`)
      .replace(
        `html`,
        `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
      )
      .replace(`tag`, qi)
      .getRegex(),
    $i = {
      ...Zi,
      lheading: Vi,
      table: Qi,
      paragraph: K(Hi)
        .replace(`hr`, Ii)
        .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
        .replace(`|lheading`, ``)
        .replace(`table`, Qi)
        .replace(`blockquote`, ` {0,3}>`)
        .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
        .replace(`list`, ` {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]`)
        .replace(
          `html`,
          `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
        )
        .replace(`tag`, qi)
        .getRegex(),
    },
    ea = {
      ...Zi,
      html: K(
        `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`,
      )
        .replace(`comment`, Ji)
        .replace(
          /tag/g,
          `(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b`,
        )
        .getRegex(),
      def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
      heading: /^(#{1,6})(.*)(?:\n+|$)/,
      fences: Ai,
      lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
      paragraph: K(Hi)
        .replace(`hr`, Ii)
        .replace(
          `heading`,
          ` *#{1,6} *[^
]`,
        )
        .replace(`lheading`, Bi)
        .replace(`|table`, ``)
        .replace(`blockquote`, ` {0,3}>`)
        .replace(`|fences`, ``)
        .replace(`|list`, ``)
        .replace(`|html`, ``)
        .replace(`|tag`, ``)
        .getRegex(),
    },
    ta = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    na = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    ra = /^( {2,}|\\)\n(?!\s*$)/,
    ia =
      /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
    aa = /[\p{P}\p{S}]/u,
    oa = /[\s\p{P}\p{S}]/u,
    sa = /[^\s\p{P}\p{S}]/u,
    ca = K(/^((?![*_])punctSpace)/, `u`)
      .replace(/punctSpace/g, oa)
      .getRegex(),
    la = /(?!~)[\p{P}\p{S}]/u,
    ua = /(?!~)[\s\p{P}\p{S}]/u,
    da = /(?:[^\s\p{P}\p{S}]|~)/u,
    fa = K(/link|precode-code|html/, `g`)
      .replace(
        `link`,
        /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/,
      )
      .replace(`precode-`, Mi ? "(?<!`)()" : "(^^|[^`])")
      .replace(`code`, /(?<b>`+)[^`]+\k<b>(?!`)/)
      .replace(`html`, /<(?! )[^<>]*?>/)
      .getRegex(),
    pa = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,
    ma = K(pa, `u`).replace(/punct/g, aa).getRegex(),
    ha = K(pa, `u`).replace(/punct/g, la).getRegex(),
    ga = `^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)`,
    _a = K(ga, `gu`)
      .replace(/notPunctSpace/g, sa)
      .replace(/punctSpace/g, oa)
      .replace(/punct/g, aa)
      .getRegex(),
    va = K(ga, `gu`)
      .replace(/notPunctSpace/g, da)
      .replace(/punctSpace/g, ua)
      .replace(/punct/g, la)
      .getRegex(),
    ya = K(
      `^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)`,
      `gu`,
    )
      .replace(/notPunctSpace/g, sa)
      .replace(/punctSpace/g, oa)
      .replace(/punct/g, aa)
      .getRegex(),
    ba = K(/^~~?(?:((?!~)punct)|[^\s~])/, `u`)
      .replace(/punct/g, aa)
      .getRegex(),
    xa = K(
      `^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)`,
      `gu`,
    )
      .replace(/notPunctSpace/g, sa)
      .replace(/punctSpace/g, oa)
      .replace(/punct/g, aa)
      .getRegex(),
    Sa = K(/\\(punct)/, `gu`)
      .replace(/punct/g, aa)
      .getRegex(),
    Ca = K(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
      .replace(`scheme`, /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
      .replace(
        `email`,
        /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
      )
      .getRegex(),
    wa = K(Ji).replace(`(?:-->|$)`, `-->`).getRegex(),
    Ta = K(
      `^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`,
    )
      .replace(`comment`, wa)
      .replace(
        `attribute`,
        /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/,
      )
      .getRegex(),
    Ea =
      /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/,
    Da = K(
      /^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/,
    )
      .replace(`label`, Ea)
      .replace(`href`, /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/)
      .replace(
        `title`,
        /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/,
      )
      .getRegex(),
    Oa = K(/^!?\[(label)\]\[(ref)\]/)
      .replace(`label`, Ea)
      .replace(`ref`, Wi)
      .getRegex(),
    ka = K(/^!?\[(ref)\](?:\[\])?/)
      .replace(`ref`, Wi)
      .getRegex(),
    Aa = K(`reflink|nolink(?!\\()`, `g`)
      .replace(`reflink`, Oa)
      .replace(`nolink`, ka)
      .getRegex(),
    ja = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,
    Ma = {
      _backpedal: Ai,
      anyPunctuation: Sa,
      autolink: Ca,
      blockSkip: fa,
      br: ra,
      code: na,
      del: Ai,
      delLDelim: Ai,
      delRDelim: Ai,
      emStrongLDelim: ma,
      emStrongRDelimAst: _a,
      emStrongRDelimUnd: ya,
      escape: ta,
      link: Da,
      nolink: ka,
      punctuation: ca,
      reflink: Oa,
      reflinkSearch: Aa,
      tag: Ta,
      text: ia,
      url: Ai,
    },
    Na = {
      ...Ma,
      link: K(/^!?\[(label)\]\((.*?)\)/)
        .replace(`label`, Ea)
        .getRegex(),
      reflink: K(/^!?\[(label)\]\s*\[([^\]]*)\]/)
        .replace(`label`, Ea)
        .getRegex(),
    },
    Pa = {
      ...Ma,
      emStrongRDelimAst: va,
      emStrongLDelim: ha,
      delLDelim: ba,
      delRDelim: xa,
      url: K(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/)
        .replace(`protocol`, ja)
        .replace(
          `email`,
          /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
        )
        .getRegex(),
      _backpedal:
        /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
      del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
      text: K(
        /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/,
      )
        .replace(`protocol`, ja)
        .getRegex(),
    },
    Fa = {
      ...Pa,
      br: K(ra).replace(`{2,}`, `*`).getRegex(),
      text: K(Pa.text)
        .replace(`\\b_`, `\\b_| {2,}\\n`)
        .replace(/\{2,\}/g, `*`)
        .getRegex(),
    },
    Ia = { normal: Zi, gfm: $i, pedantic: ea },
    La = { normal: Ma, gfm: Pa, breaks: Fa, pedantic: Na },
    Ra = {
      "&": `&amp;`,
      "<": `&lt;`,
      ">": `&gt;`,
      '"': `&quot;`,
      "'": `&#39;`,
    },
    za = (e) => Ra[e];
  function Ba(e, t) {
    if (t) {
      if (q.escapeTest.test(e)) return e.replace(q.escapeReplace, za);
    } else if (q.escapeTestNoEncode.test(e))
      return e.replace(q.escapeReplaceNoEncode, za);
    return e;
  }
  function Va(e) {
    try {
      e = encodeURI(e).replace(q.percentDecode, `%`);
    } catch {
      return null;
    }
    return e;
  }
  function Ha(e, t) {
    let n = e
        .replace(q.findPipe, (e, t, n) => {
          let r = !1,
            i = t;
          for (; --i >= 0 && n[i] === `\\`; ) r = !r;
          return r ? `|` : ` |`;
        })
        .split(q.splitPipe),
      r = 0;
    if (
      (n[0].trim() || n.shift(),
      n.length > 0 && !n.at(-1)?.trim() && n.pop(),
      t)
    )
      if (n.length > t) n.splice(t);
      else for (; n.length < t; ) n.push(``);
    for (; r < n.length; r++) n[r] = n[r].trim().replace(q.slashPipe, `|`);
    return n;
  }
  function Ua(e, t, n) {
    let r = e.length;
    if (r === 0) return ``;
    let i = 0;
    for (; i < r; ) {
      let a = e.charAt(r - i - 1);
      if (a === t && !n) i++;
      else if (a !== t && n) i++;
      else break;
    }
    return e.slice(0, r - i);
  }
  function Wa(e) {
    let t = e.split(`
`),
      n = t.length - 1;
    for (; n >= 0 && q.blankLine.test(t[n]); ) n--;
    return t.length - n <= 2
      ? e
      : t.slice(0, n + 1).join(`
`);
  }
  function Ga(e, t) {
    if (e.indexOf(t[1]) === -1) return -1;
    let n = 0;
    for (let r = 0; r < e.length; r++)
      if (e[r] === `\\`) r++;
      else if (e[r] === t[0]) n++;
      else if (e[r] === t[1] && (n--, n < 0)) return r;
    return n > 0 ? -2 : -1;
  }
  function Ka(e, t = 0) {
    let n = t,
      r = ``;
    for (let t of e)
      if (t === `	`) {
        let e = 4 - (n % 4);
        ((r += ` `.repeat(e)), (n += e));
      } else ((r += t), n++);
    return r;
  }
  function qa(e, t, n, r, i) {
    let a = t.href,
      o = t.title || null,
      s = e[1].replace(i.other.outputLinkReplace, `$1`);
    r.state.inLink = !0;
    let c = {
      type: e[0].charAt(0) === `!` ? `image` : `link`,
      raw: n,
      href: a,
      title: o,
      text: s,
      tokens: r.inlineTokens(s),
    };
    return ((r.state.inLink = !1), c);
  }
  function Ja(e, t, n) {
    let r = e.match(n.other.indentCodeCompensation);
    if (r === null) return t;
    let i = r[1];
    return t
      .split(
        `
`,
      )
      .map((e) => {
        let t = e.match(n.other.beginningSpace);
        if (t === null) return e;
        let [r] = t;
        return r.length >= i.length ? e.slice(i.length) : e;
      }).join(`
`);
  }
  var Ya = class {
      options;
      rules;
      lexer;
      constructor(e) {
        this.options = e || Oi;
      }
      space(e) {
        let t = this.rules.block.newline.exec(e);
        if (t && t[0].length > 0) return { type: `space`, raw: t[0] };
      }
      code(e) {
        let t = this.rules.block.code.exec(e);
        if (t) {
          let e = this.options.pedantic ? t[0] : Wa(t[0]);
          return {
            type: `code`,
            raw: e,
            codeBlockStyle: `indented`,
            text: e.replace(this.rules.other.codeRemoveIndent, ``),
          };
        }
      }
      fences(e) {
        let t = this.rules.block.fences.exec(e);
        if (t) {
          let e = t[0],
            n = Ja(e, t[3] || ``, this.rules);
          return {
            type: `code`,
            raw: e,
            lang: t[2]
              ? t[2].trim().replace(this.rules.inline.anyPunctuation, `$1`)
              : t[2],
            text: n,
          };
        }
      }
      heading(e) {
        let t = this.rules.block.heading.exec(e);
        if (t) {
          let e = t[2].trim();
          if (this.rules.other.endingHash.test(e)) {
            let t = Ua(e, `#`);
            (this.options.pedantic ||
              !t ||
              this.rules.other.endingSpaceChar.test(t)) &&
              (e = t.trim());
          }
          return {
            type: `heading`,
            raw: Ua(
              t[0],
              `
`,
            ),
            depth: t[1].length,
            text: e,
            tokens: this.lexer.inline(e),
          };
        }
      }
      hr(e) {
        let t = this.rules.block.hr.exec(e);
        if (t)
          return {
            type: `hr`,
            raw: Ua(
              t[0],
              `
`,
            ),
          };
      }
      blockquote(e) {
        let t = this.rules.block.blockquote.exec(e);
        if (t) {
          let e = Ua(
              t[0],
              `
`,
            ).split(`
`),
            n = ``,
            r = ``,
            i = [];
          for (; e.length > 0; ) {
            let t = !1,
              a = [],
              o;
            for (o = 0; o < e.length; o++)
              if (this.rules.other.blockquoteStart.test(e[o]))
                (a.push(e[o]), (t = !0));
              else if (!t) a.push(e[o]);
              else break;
            e = e.slice(o);
            let s = a.join(`
`),
              c = s
                .replace(
                  this.rules.other.blockquoteSetextReplace,
                  `
    $1`,
                )
                .replace(this.rules.other.blockquoteSetextReplace2, ``);
            ((n = n
              ? `${n}
${s}`
              : s),
              (r = r
                ? `${r}
${c}`
                : c));
            let l = this.lexer.state.top;
            if (
              ((this.lexer.state.top = !0),
              this.lexer.blockTokens(c, i, !0),
              (this.lexer.state.top = l),
              e.length === 0)
            )
              break;
            let u = i.at(-1);
            if (u?.type === `code`) break;
            if (u?.type === `blockquote`) {
              let t = u,
                a =
                  t.raw +
                  `
` +
                  e.join(`
`),
                o = this.blockquote(a);
              ((i[i.length - 1] = o),
                (n = n.substring(0, n.length - t.raw.length) + o.raw),
                (r = r.substring(0, r.length - t.text.length) + o.text));
              break;
            } else if (u?.type === `list`) {
              let t = u,
                a =
                  t.raw +
                  `
` +
                  e.join(`
`),
                o = this.list(a);
              ((i[i.length - 1] = o),
                (n = n.substring(0, n.length - u.raw.length) + o.raw),
                (r = r.substring(0, r.length - t.raw.length) + o.raw),
                (e = a.substring(i.at(-1).raw.length).split(`
`)));
              continue;
            }
          }
          return { type: `blockquote`, raw: n, tokens: i, text: r };
        }
      }
      list(e) {
        let t = this.rules.block.list.exec(e);
        if (t) {
          let n = t[1].trim(),
            r = n.length > 1,
            i = {
              type: `list`,
              raw: ``,
              ordered: r,
              start: r ? +n.slice(0, -1) : ``,
              loose: !1,
              items: [],
            };
          ((n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`),
            this.options.pedantic && (n = r ? n : `[*+-]`));
          let a = this.rules.other.listItemRegex(n),
            o = !1;
          for (; e; ) {
            let n = !1,
              r = ``,
              s = ``;
            if (!(t = a.exec(e)) || this.rules.block.hr.test(e)) break;
            ((r = t[0]), (e = e.substring(r.length)));
            let c = Ka(
                t[2].split(
                  `
`,
                  1,
                )[0],
                t[1].length,
              ),
              l = e.split(
                `
`,
                1,
              )[0],
              u = !c.trim(),
              d = 0;
            if (
              (this.options.pedantic
                ? ((d = 2), (s = c.trimStart()))
                : u
                  ? (d = t[1].length + 1)
                  : ((d = c.search(this.rules.other.nonSpaceChar)),
                    (d = d > 4 ? 1 : d),
                    (s = c.slice(d)),
                    (d += t[1].length)),
              u &&
                this.rules.other.blankLine.test(l) &&
                ((r +=
                  l +
                  `
`),
                (e = e.substring(l.length + 1)),
                (n = !0)),
              !n)
            ) {
              let t = this.rules.other.nextBulletRegex(d),
                n = this.rules.other.hrRegex(d),
                i = this.rules.other.fencesBeginRegex(d),
                a = this.rules.other.headingBeginRegex(d),
                o = this.rules.other.htmlBeginRegex(d),
                f = this.rules.other.blockquoteBeginRegex(d);
              for (; e; ) {
                let p = e.split(
                    `
`,
                    1,
                  )[0],
                  m;
                if (
                  ((l = p),
                  this.options.pedantic
                    ? ((l = l.replace(
                        this.rules.other.listReplaceNesting,
                        `  `,
                      )),
                      (m = l))
                    : (m = l.replace(this.rules.other.tabCharGlobal, `    `)),
                  i.test(l) ||
                    a.test(l) ||
                    o.test(l) ||
                    f.test(l) ||
                    t.test(l) ||
                    n.test(l))
                )
                  break;
                if (m.search(this.rules.other.nonSpaceChar) >= d || !l.trim())
                  s +=
                    `
` + m.slice(d);
                else {
                  if (
                    u ||
                    c
                      .replace(this.rules.other.tabCharGlobal, `    `)
                      .search(this.rules.other.nonSpaceChar) >= 4 ||
                    i.test(c) ||
                    a.test(c) ||
                    n.test(c)
                  )
                    break;
                  s +=
                    `
` + l;
                }
                ((u = !l.trim()),
                  (r +=
                    p +
                    `
`),
                  (e = e.substring(p.length + 1)),
                  (c = m.slice(d)));
              }
            }
            (i.loose ||
              (o
                ? (i.loose = !0)
                : this.rules.other.doubleBlankLine.test(r) && (o = !0)),
              i.items.push({
                type: `list_item`,
                raw: r,
                task: !!this.options.gfm && this.rules.other.listIsTask.test(s),
                loose: !1,
                text: s,
                tokens: [],
              }),
              (i.raw += r));
          }
          let s = i.items.at(-1);
          if (s) ((s.raw = s.raw.trimEnd()), (s.text = s.text.trimEnd()));
          else return;
          i.raw = i.raw.trimEnd();
          for (let e of i.items) {
            ((this.lexer.state.top = !1),
              (e.tokens = this.lexer.blockTokens(e.text, [])));
            let t = e.tokens[0];
            if (e.task && (t?.type === `text` || t?.type === `paragraph`)) {
              ((e.text = e.text.replace(this.rules.other.listReplaceTask, ``)),
                (t.raw = t.raw.replace(this.rules.other.listReplaceTask, ``)),
                (t.text = t.text.replace(
                  this.rules.other.listReplaceTask,
                  ``,
                )));
              for (let e = this.lexer.inlineQueue.length - 1; e >= 0; e--)
                if (
                  this.rules.other.listIsTask.test(
                    this.lexer.inlineQueue[e].src,
                  )
                ) {
                  this.lexer.inlineQueue[e].src = this.lexer.inlineQueue[
                    e
                  ].src.replace(this.rules.other.listReplaceTask, ``);
                  break;
                }
              let n = this.rules.other.listTaskCheckbox.exec(e.raw);
              if (n) {
                let t = {
                  type: `checkbox`,
                  raw: n[0] + ` `,
                  checked: n[0] !== `[ ]`,
                };
                ((e.checked = t.checked),
                  i.loose
                    ? e.tokens[0] &&
                      [`paragraph`, `text`].includes(e.tokens[0].type) &&
                      `tokens` in e.tokens[0] &&
                      e.tokens[0].tokens
                      ? ((e.tokens[0].raw = t.raw + e.tokens[0].raw),
                        (e.tokens[0].text = t.raw + e.tokens[0].text),
                        e.tokens[0].tokens.unshift(t))
                      : e.tokens.unshift({
                          type: `paragraph`,
                          raw: t.raw,
                          text: t.raw,
                          tokens: [t],
                        })
                    : e.tokens.unshift(t));
              }
            } else e.task &&= !1;
            if (!i.loose) {
              let t = e.tokens.filter((e) => e.type === `space`);
              i.loose =
                t.length > 0 &&
                t.some((e) => this.rules.other.anyLine.test(e.raw));
            }
          }
          if (i.loose)
            for (let e of i.items) {
              e.loose = !0;
              for (let t of e.tokens)
                t.type === `text` && (t.type = `paragraph`);
            }
          return i;
        }
      }
      html(e) {
        let t = this.rules.block.html.exec(e);
        if (t) {
          let e = Wa(t[0]);
          return {
            type: `html`,
            block: !0,
            raw: e,
            pre: t[1] === `pre` || t[1] === `script` || t[1] === `style`,
            text: e,
          };
        }
      }
      def(e) {
        let t = this.rules.block.def.exec(e);
        if (t) {
          let e = t[1]
              .toLowerCase()
              .replace(this.rules.other.multipleSpaceGlobal, ` `),
            n = t[2]
              ? t[2]
                  .replace(this.rules.other.hrefBrackets, `$1`)
                  .replace(this.rules.inline.anyPunctuation, `$1`)
              : ``,
            r = t[3]
              ? t[3]
                  .substring(1, t[3].length - 1)
                  .replace(this.rules.inline.anyPunctuation, `$1`)
              : t[3];
          return {
            type: `def`,
            tag: e,
            raw: Ua(
              t[0],
              `
`,
            ),
            href: n,
            title: r,
          };
        }
      }
      table(e) {
        let t = this.rules.block.table.exec(e);
        if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
        let n = Ha(t[1]),
          r = t[2].replace(this.rules.other.tableAlignChars, ``).split(`|`),
          i = t[3]?.trim()
            ? t[3].replace(this.rules.other.tableRowBlankLine, ``).split(`
`)
            : [],
          a = {
            type: `table`,
            raw: Ua(
              t[0],
              `
`,
            ),
            header: [],
            align: [],
            rows: [],
          };
        if (n.length === r.length) {
          for (let e of r)
            this.rules.other.tableAlignRight.test(e)
              ? a.align.push(`right`)
              : this.rules.other.tableAlignCenter.test(e)
                ? a.align.push(`center`)
                : this.rules.other.tableAlignLeft.test(e)
                  ? a.align.push(`left`)
                  : a.align.push(null);
          for (let e = 0; e < n.length; e++)
            a.header.push({
              text: n[e],
              tokens: this.lexer.inline(n[e]),
              header: !0,
              align: a.align[e],
            });
          for (let e of i)
            a.rows.push(
              Ha(e, a.header.length).map((e, t) => ({
                text: e,
                tokens: this.lexer.inline(e),
                header: !1,
                align: a.align[t],
              })),
            );
          return a;
        }
      }
      lheading(e) {
        let t = this.rules.block.lheading.exec(e);
        if (t) {
          let e = t[1].trim();
          return {
            type: `heading`,
            raw: Ua(
              t[0],
              `
`,
            ),
            depth: t[2].charAt(0) === `=` ? 1 : 2,
            text: e,
            tokens: this.lexer.inline(e),
          };
        }
      }
      paragraph(e) {
        let t = this.rules.block.paragraph.exec(e);
        if (t) {
          let e =
            t[1].charAt(t[1].length - 1) ===
            `
`
              ? t[1].slice(0, -1)
              : t[1];
          return {
            type: `paragraph`,
            raw: t[0],
            text: e,
            tokens: this.lexer.inline(e),
          };
        }
      }
      text(e) {
        let t = this.rules.block.text.exec(e);
        if (t)
          return {
            type: `text`,
            raw: t[0],
            text: t[0],
            tokens: this.lexer.inline(t[0]),
          };
      }
      escape(e) {
        let t = this.rules.inline.escape.exec(e);
        if (t) return { type: `escape`, raw: t[0], text: t[1] };
      }
      tag(e) {
        let t = this.rules.inline.tag.exec(e);
        if (t)
          return (
            !this.lexer.state.inLink && this.rules.other.startATag.test(t[0])
              ? (this.lexer.state.inLink = !0)
              : this.lexer.state.inLink &&
                this.rules.other.endATag.test(t[0]) &&
                (this.lexer.state.inLink = !1),
            !this.lexer.state.inRawBlock &&
            this.rules.other.startPreScriptTag.test(t[0])
              ? (this.lexer.state.inRawBlock = !0)
              : this.lexer.state.inRawBlock &&
                this.rules.other.endPreScriptTag.test(t[0]) &&
                (this.lexer.state.inRawBlock = !1),
            {
              type: `html`,
              raw: t[0],
              inLink: this.lexer.state.inLink,
              inRawBlock: this.lexer.state.inRawBlock,
              block: !1,
              text: t[0],
            }
          );
      }
      link(e) {
        let t = this.rules.inline.link.exec(e);
        if (t) {
          let e = t[2].trim();
          if (
            !this.options.pedantic &&
            this.rules.other.startAngleBracket.test(e)
          ) {
            if (!this.rules.other.endAngleBracket.test(e)) return;
            let t = Ua(e.slice(0, -1), `\\`);
            if ((e.length - t.length) % 2 == 0) return;
          } else {
            let e = Ga(t[2], `()`);
            if (e === -2) return;
            if (e > -1) {
              let n = (t[0].indexOf(`!`) === 0 ? 5 : 4) + t[1].length + e;
              ((t[2] = t[2].substring(0, e)),
                (t[0] = t[0].substring(0, n).trim()),
                (t[3] = ``));
            }
          }
          let n = t[2],
            r = ``;
          if (this.options.pedantic) {
            let e = this.rules.other.pedanticHrefTitle.exec(n);
            e && ((n = e[1]), (r = e[3]));
          } else r = t[3] ? t[3].slice(1, -1) : ``;
          return (
            (n = n.trim()),
            this.rules.other.startAngleBracket.test(n) &&
              (n =
                this.options.pedantic &&
                !this.rules.other.endAngleBracket.test(e)
                  ? n.slice(1)
                  : n.slice(1, -1)),
            qa(
              t,
              {
                href: n && n.replace(this.rules.inline.anyPunctuation, `$1`),
                title: r && r.replace(this.rules.inline.anyPunctuation, `$1`),
              },
              t[0],
              this.lexer,
              this.rules,
            )
          );
        }
      }
      reflink(e, t) {
        let n;
        if (
          (n = this.rules.inline.reflink.exec(e)) ||
          (n = this.rules.inline.nolink.exec(e))
        ) {
          let e =
            t[
              (n[2] || n[1])
                .replace(this.rules.other.multipleSpaceGlobal, ` `)
                .toLowerCase()
            ];
          if (!e) {
            let e = n[0].charAt(0);
            return { type: `text`, raw: e, text: e };
          }
          return qa(n, e, n[0], this.lexer, this.rules);
        }
      }
      emStrong(e, t, n = ``) {
        let r = this.rules.inline.emStrongLDelim.exec(e);
        if (
          !(
            !r ||
            (!r[1] && !r[2] && !r[3] && !r[4]) ||
            (r[4] && n.match(this.rules.other.unicodeAlphaNumeric))
          ) &&
          (!(r[1] || r[3]) || !n || this.rules.inline.punctuation.exec(n))
        ) {
          let n = [...r[0]].length - 1,
            i,
            a,
            o = n,
            s = 0,
            c =
              r[0][0] === `*`
                ? this.rules.inline.emStrongRDelimAst
                : this.rules.inline.emStrongRDelimUnd;
          for (
            c.lastIndex = 0, t = t.slice(-1 * e.length + n);
            (r = c.exec(t)) !== null;
          ) {
            if (((i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6]), !i))
              continue;
            if (((a = [...i].length), r[3] || r[4])) {
              o += a;
              continue;
            } else if ((r[5] || r[6]) && n % 3 && !((n + a) % 3)) {
              s += a;
              continue;
            }
            if (((o -= a), o > 0)) continue;
            a = Math.min(a, a + o + s);
            let t = [...r[0]][0].length,
              c = e.slice(0, n + r.index + t + a);
            if (Math.min(n, a) % 2) {
              let e = c.slice(1, -1);
              return {
                type: `em`,
                raw: c,
                text: e,
                tokens: this.lexer.inlineTokens(e),
              };
            }
            let l = c.slice(2, -2);
            return {
              type: `strong`,
              raw: c,
              text: l,
              tokens: this.lexer.inlineTokens(l),
            };
          }
        }
      }
      codespan(e) {
        let t = this.rules.inline.code.exec(e);
        if (t) {
          let e = t[2].replace(this.rules.other.newLineCharGlobal, ` `),
            n = this.rules.other.nonSpaceChar.test(e),
            r =
              this.rules.other.startingSpaceChar.test(e) &&
              this.rules.other.endingSpaceChar.test(e);
          return (
            n && r && (e = e.substring(1, e.length - 1)),
            { type: `codespan`, raw: t[0], text: e }
          );
        }
      }
      br(e) {
        let t = this.rules.inline.br.exec(e);
        if (t) return { type: `br`, raw: t[0] };
      }
      del(e, t, n = ``) {
        let r = this.rules.inline.delLDelim.exec(e);
        if (r && (!r[1] || !n || this.rules.inline.punctuation.exec(n))) {
          let n = [...r[0]].length - 1,
            i,
            a,
            o = n,
            s = this.rules.inline.delRDelim;
          for (
            s.lastIndex = 0, t = t.slice(-1 * e.length + n);
            (r = s.exec(t)) !== null;
          ) {
            if (
              ((i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6]),
              !i || ((a = [...i].length), a !== n))
            )
              continue;
            if (r[3] || r[4]) {
              o += a;
              continue;
            }
            if (((o -= a), o > 0)) continue;
            a = Math.min(a, a + o);
            let t = [...r[0]][0].length,
              s = e.slice(0, n + r.index + t + a),
              c = s.slice(n, -n);
            return {
              type: `del`,
              raw: s,
              text: c,
              tokens: this.lexer.inlineTokens(c),
            };
          }
        }
      }
      autolink(e) {
        let t = this.rules.inline.autolink.exec(e);
        if (t) {
          let e, n;
          return (
            t[2] === `@`
              ? ((e = t[1]), (n = `mailto:` + e))
              : ((e = t[1]), (n = e)),
            {
              type: `link`,
              raw: t[0],
              text: e,
              href: n,
              tokens: [{ type: `text`, raw: e, text: e }],
            }
          );
        }
      }
      url(e) {
        let t;
        if ((t = this.rules.inline.url.exec(e))) {
          let e, n;
          if (t[2] === `@`) ((e = t[0]), (n = `mailto:` + e));
          else {
            let r;
            do
              ((r = t[0]),
                (t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? ``));
            while (r !== t[0]);
            ((e = t[0]), (n = t[1] === `www.` ? `http://` + t[0] : t[0]));
          }
          return {
            type: `link`,
            raw: t[0],
            text: e,
            href: n,
            tokens: [{ type: `text`, raw: e, text: e }],
          };
        }
      }
      inlineText(e) {
        let t = this.rules.inline.text.exec(e);
        if (t) {
          let e = this.lexer.state.inRawBlock;
          return { type: `text`, raw: t[0], text: t[0], escaped: e };
        }
      }
    },
    Xa = class e {
      tokens;
      options;
      state;
      inlineQueue;
      tokenizer;
      constructor(e) {
        ((this.tokens = []),
          (this.tokens.links = Object.create(null)),
          (this.options = e || Oi),
          (this.options.tokenizer = this.options.tokenizer || new Ya()),
          (this.tokenizer = this.options.tokenizer),
          (this.tokenizer.options = this.options),
          (this.tokenizer.lexer = this),
          (this.inlineQueue = []),
          (this.state = { inLink: !1, inRawBlock: !1, top: !0 }));
        let t = { other: q, block: Ia.normal, inline: La.normal };
        (this.options.pedantic
          ? ((t.block = Ia.pedantic), (t.inline = La.pedantic))
          : this.options.gfm &&
            ((t.block = Ia.gfm),
            this.options.breaks ? (t.inline = La.breaks) : (t.inline = La.gfm)),
          (this.tokenizer.rules = t));
      }
      static get rules() {
        return { block: Ia, inline: La };
      }
      static lex(t, n) {
        return new e(n).lex(t);
      }
      static lexInline(t, n) {
        return new e(n).inlineTokens(t);
      }
      lex(e) {
        ((e = e.replace(
          q.carriageReturn,
          `
`,
        )),
          this.blockTokens(e, this.tokens));
        for (let e = 0; e < this.inlineQueue.length; e++) {
          let t = this.inlineQueue[e];
          this.inlineTokens(t.src, t.tokens);
        }
        return ((this.inlineQueue = []), this.tokens);
      }
      blockTokens(e, t = [], n = !1) {
        ((this.tokenizer.lexer = this),
          this.options.pedantic &&
            (e = e.replace(q.tabCharGlobal, `    `).replace(q.spaceLine, ``)));
        let r = 1 / 0;
        for (; e; ) {
          if (e.length < r) r = e.length;
          else {
            this.infiniteLoopError(e.charCodeAt(0));
            break;
          }
          let i;
          if (
            this.options.extensions?.block?.some((n) =>
              (i = n.call({ lexer: this }, e, t))
                ? ((e = e.substring(i.raw.length)), t.push(i), !0)
                : !1,
            )
          )
            continue;
          if ((i = this.tokenizer.space(e))) {
            e = e.substring(i.raw.length);
            let n = t.at(-1);
            i.raw.length === 1 && n !== void 0
              ? (n.raw += `
`)
              : t.push(i);
            continue;
          }
          if ((i = this.tokenizer.code(e))) {
            e = e.substring(i.raw.length);
            let n = t.at(-1);
            n?.type === `paragraph` || n?.type === `text`
              ? ((n.raw +=
                  (n.raw.endsWith(`
`)
                    ? ``
                    : `
`) + i.raw),
                (n.text +=
                  `
` + i.text),
                (this.inlineQueue.at(-1).src = n.text))
              : t.push(i);
            continue;
          }
          if ((i = this.tokenizer.fences(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.heading(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.hr(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.blockquote(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.list(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.html(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.def(e))) {
            e = e.substring(i.raw.length);
            let n = t.at(-1);
            n?.type === `paragraph` || n?.type === `text`
              ? ((n.raw +=
                  (n.raw.endsWith(`
`)
                    ? ``
                    : `
`) + i.raw),
                (n.text +=
                  `
` + i.raw),
                (this.inlineQueue.at(-1).src = n.text))
              : this.tokens.links[i.tag] ||
                ((this.tokens.links[i.tag] = { href: i.href, title: i.title }),
                t.push(i));
            continue;
          }
          if ((i = this.tokenizer.table(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          if ((i = this.tokenizer.lheading(e))) {
            ((e = e.substring(i.raw.length)), t.push(i));
            continue;
          }
          let a = e;
          if (this.options.extensions?.startBlock) {
            let t = 1 / 0,
              n = e.slice(1),
              r;
            (this.options.extensions.startBlock.forEach((e) => {
              ((r = e.call({ lexer: this }, n)),
                typeof r == `number` && r >= 0 && (t = Math.min(t, r)));
            }),
              t < 1 / 0 && t >= 0 && (a = e.substring(0, t + 1)));
          }
          if (this.state.top && (i = this.tokenizer.paragraph(a))) {
            let r = t.at(-1);
            (n && r?.type === `paragraph`
              ? ((r.raw +=
                  (r.raw.endsWith(`
`)
                    ? ``
                    : `
`) + i.raw),
                (r.text +=
                  `
` + i.text),
                this.inlineQueue.pop(),
                (this.inlineQueue.at(-1).src = r.text))
              : t.push(i),
              (n = a.length !== e.length),
              (e = e.substring(i.raw.length)));
            continue;
          }
          if ((i = this.tokenizer.text(e))) {
            e = e.substring(i.raw.length);
            let n = t.at(-1);
            n?.type === `text`
              ? ((n.raw +=
                  (n.raw.endsWith(`
`)
                    ? ``
                    : `
`) + i.raw),
                (n.text +=
                  `
` + i.text),
                this.inlineQueue.pop(),
                (this.inlineQueue.at(-1).src = n.text))
              : t.push(i);
            continue;
          }
          if (e) {
            this.infiniteLoopError(e.charCodeAt(0));
            break;
          }
        }
        return ((this.state.top = !0), t);
      }
      inline(e, t = []) {
        return (this.inlineQueue.push({ src: e, tokens: t }), t);
      }
      inlineTokens(e, t = []) {
        this.tokenizer.lexer = this;
        let n = e,
          r = null;
        if (this.tokens.links) {
          let e = Object.keys(this.tokens.links);
          if (e.length > 0)
            for (
              ;
              (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null;
            )
              e.includes(r[0].slice(r[0].lastIndexOf(`[`) + 1, -1)) &&
                (n =
                  n.slice(0, r.index) +
                  `[` +
                  `a`.repeat(r[0].length - 2) +
                  `]` +
                  n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
        }
        for (
          ;
          (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null;
        )
          n =
            n.slice(0, r.index) +
            `++` +
            n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
        let i;
        for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null; )
          ((i = r[2] ? r[2].length : 0),
            (n =
              n.slice(0, r.index + i) +
              `[` +
              `a`.repeat(r[0].length - i - 2) +
              `]` +
              n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex)));
        n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
        let a = !1,
          o = ``,
          s = 1 / 0;
        for (; e; ) {
          if (e.length < s) s = e.length;
          else {
            this.infiniteLoopError(e.charCodeAt(0));
            break;
          }
          (a || (o = ``), (a = !1));
          let r;
          if (
            this.options.extensions?.inline?.some((n) =>
              (r = n.call({ lexer: this }, e, t))
                ? ((e = e.substring(r.raw.length)), t.push(r), !0)
                : !1,
            )
          )
            continue;
          if ((r = this.tokenizer.escape(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.tag(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.link(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.reflink(e, this.tokens.links))) {
            e = e.substring(r.raw.length);
            let n = t.at(-1);
            r.type === `text` && n?.type === `text`
              ? ((n.raw += r.raw), (n.text += r.text))
              : t.push(r);
            continue;
          }
          if ((r = this.tokenizer.emStrong(e, n, o))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.codespan(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.br(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.del(e, n, o))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if ((r = this.tokenizer.autolink(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          if (!this.state.inLink && (r = this.tokenizer.url(e))) {
            ((e = e.substring(r.raw.length)), t.push(r));
            continue;
          }
          let i = e;
          if (this.options.extensions?.startInline) {
            let t = 1 / 0,
              n = e.slice(1),
              r;
            (this.options.extensions.startInline.forEach((e) => {
              ((r = e.call({ lexer: this }, n)),
                typeof r == `number` && r >= 0 && (t = Math.min(t, r)));
            }),
              t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1)));
          }
          if ((r = this.tokenizer.inlineText(i))) {
            ((e = e.substring(r.raw.length)),
              r.raw.slice(-1) !== `_` && (o = r.raw.slice(-1)),
              (a = !0));
            let n = t.at(-1);
            n?.type === `text`
              ? ((n.raw += r.raw), (n.text += r.text))
              : t.push(r);
            continue;
          }
          if (e) {
            this.infiniteLoopError(e.charCodeAt(0));
            break;
          }
        }
        return t;
      }
      infiniteLoopError(e) {
        let t = `Infinite loop on byte: ` + e;
        if (this.options.silent) console.error(t);
        else throw Error(t);
      }
    },
    Za = class {
      options;
      parser;
      constructor(e) {
        this.options = e || Oi;
      }
      space(e) {
        return ``;
      }
      code({ text: e, lang: t, escaped: n }) {
        let r = (t || ``).match(q.notSpaceStart)?.[0],
          i =
            e.replace(q.endingNewline, ``) +
            `
`;
        return r
          ? `<pre><code class="language-` +
              Ba(r) +
              `">` +
              (n ? i : Ba(i, !0)) +
              `</code></pre>
`
          : `<pre><code>` +
              (n ? i : Ba(i, !0)) +
              `</code></pre>
`;
      }
      blockquote({ tokens: e }) {
        return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
      }
      html({ text: e }) {
        return e;
      }
      def(e) {
        return ``;
      }
      heading({ tokens: e, depth: t }) {
        return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
      }
      hr(e) {
        return `<hr>
`;
      }
      list(e) {
        let t = e.ordered,
          n = e.start,
          r = ``;
        for (let t = 0; t < e.items.length; t++) {
          let n = e.items[t];
          r += this.listitem(n);
        }
        let i = t ? `ol` : `ul`,
          a = t && n !== 1 ? ` start="` + n + `"` : ``;
        return (
          `<` +
          i +
          a +
          `>
` +
          r +
          `</` +
          i +
          `>
`
        );
      }
      listitem(e) {
        return `<li>${this.parser.parse(e.tokens)}</li>
`;
      }
      checkbox({ checked: e }) {
        return (
          `<input ` + (e ? `checked="" ` : ``) + `disabled="" type="checkbox"> `
        );
      }
      paragraph({ tokens: e }) {
        return `<p>${this.parser.parseInline(e)}</p>
`;
      }
      table(e) {
        let t = ``,
          n = ``;
        for (let t = 0; t < e.header.length; t++)
          n += this.tablecell(e.header[t]);
        t += this.tablerow({ text: n });
        let r = ``;
        for (let t = 0; t < e.rows.length; t++) {
          let i = e.rows[t];
          n = ``;
          for (let e = 0; e < i.length; e++) n += this.tablecell(i[e]);
          r += this.tablerow({ text: n });
        }
        return (
          (r &&= `<tbody>${r}</tbody>`),
          `<table>
<thead>
` +
            t +
            `</thead>
` +
            r +
            `</table>
`
        );
      }
      tablerow({ text: e }) {
        return `<tr>
${e}</tr>
`;
      }
      tablecell(e) {
        let t = this.parser.parseInline(e.tokens),
          n = e.header ? `th` : `td`;
        return (
          (e.align ? `<${n} align="${e.align}">` : `<${n}>`) +
          t +
          `</${n}>
`
        );
      }
      strong({ tokens: e }) {
        return `<strong>${this.parser.parseInline(e)}</strong>`;
      }
      em({ tokens: e }) {
        return `<em>${this.parser.parseInline(e)}</em>`;
      }
      codespan({ text: e }) {
        return `<code>${Ba(e, !0)}</code>`;
      }
      br(e) {
        return `<br>`;
      }
      del({ tokens: e }) {
        return `<del>${this.parser.parseInline(e)}</del>`;
      }
      link({ href: e, title: t, tokens: n }) {
        let r = this.parser.parseInline(n),
          i = Va(e);
        if (i === null) return r;
        e = i;
        let a = `<a href="` + e + `"`;
        return (
          t && (a += ` title="` + Ba(t) + `"`),
          (a += `>` + r + `</a>`),
          a
        );
      }
      image({ href: e, title: t, text: n, tokens: r }) {
        r && (n = this.parser.parseInline(r, this.parser.textRenderer));
        let i = Va(e);
        if (i === null) return Ba(n);
        e = i;
        let a = `<img src="${e}" alt="${Ba(n)}"`;
        return (t && (a += ` title="${Ba(t)}"`), (a += `>`), a);
      }
      text(e) {
        return `tokens` in e && e.tokens
          ? this.parser.parseInline(e.tokens)
          : `escaped` in e && e.escaped
            ? e.text
            : Ba(e.text);
      }
    },
    Qa = class {
      strong({ text: e }) {
        return e;
      }
      em({ text: e }) {
        return e;
      }
      codespan({ text: e }) {
        return e;
      }
      del({ text: e }) {
        return e;
      }
      html({ text: e }) {
        return e;
      }
      text({ text: e }) {
        return e;
      }
      link({ text: e }) {
        return `` + e;
      }
      image({ text: e }) {
        return `` + e;
      }
      br() {
        return ``;
      }
      checkbox({ raw: e }) {
        return e;
      }
    },
    $a = class e {
      options;
      renderer;
      textRenderer;
      constructor(e) {
        ((this.options = e || Oi),
          (this.options.renderer = this.options.renderer || new Za()),
          (this.renderer = this.options.renderer),
          (this.renderer.options = this.options),
          (this.renderer.parser = this),
          (this.textRenderer = new Qa()));
      }
      static parse(t, n) {
        return new e(n).parse(t);
      }
      static parseInline(t, n) {
        return new e(n).parseInline(t);
      }
      parse(e) {
        this.renderer.parser = this;
        let t = ``;
        for (let n = 0; n < e.length; n++) {
          let r = e[n];
          if (this.options.extensions?.renderers?.[r.type]) {
            let e = r,
              n = this.options.extensions.renderers[e.type].call(
                { parser: this },
                e,
              );
            if (
              n !== !1 ||
              ![
                `space`,
                `hr`,
                `heading`,
                `code`,
                `table`,
                `blockquote`,
                `list`,
                `html`,
                `def`,
                `paragraph`,
                `text`,
              ].includes(e.type)
            ) {
              t += n || ``;
              continue;
            }
          }
          let i = r;
          switch (i.type) {
            case `space`:
              t += this.renderer.space(i);
              break;
            case `hr`:
              t += this.renderer.hr(i);
              break;
            case `heading`:
              t += this.renderer.heading(i);
              break;
            case `code`:
              t += this.renderer.code(i);
              break;
            case `table`:
              t += this.renderer.table(i);
              break;
            case `blockquote`:
              t += this.renderer.blockquote(i);
              break;
            case `list`:
              t += this.renderer.list(i);
              break;
            case `checkbox`:
              t += this.renderer.checkbox(i);
              break;
            case `html`:
              t += this.renderer.html(i);
              break;
            case `def`:
              t += this.renderer.def(i);
              break;
            case `paragraph`:
              t += this.renderer.paragraph(i);
              break;
            case `text`:
              t += this.renderer.text(i);
              break;
            default: {
              let e = `Token with "` + i.type + `" type was not found.`;
              if (this.options.silent) return (console.error(e), ``);
              throw Error(e);
            }
          }
        }
        return t;
      }
      parseInline(e, t = this.renderer) {
        this.renderer.parser = this;
        let n = ``;
        for (let r = 0; r < e.length; r++) {
          let i = e[r];
          if (this.options.extensions?.renderers?.[i.type]) {
            let e = this.options.extensions.renderers[i.type].call(
              { parser: this },
              i,
            );
            if (
              e !== !1 ||
              ![
                `escape`,
                `html`,
                `link`,
                `image`,
                `strong`,
                `em`,
                `codespan`,
                `br`,
                `del`,
                `text`,
              ].includes(i.type)
            ) {
              n += e || ``;
              continue;
            }
          }
          let a = i;
          switch (a.type) {
            case `escape`:
              n += t.text(a);
              break;
            case `html`:
              n += t.html(a);
              break;
            case `link`:
              n += t.link(a);
              break;
            case `image`:
              n += t.image(a);
              break;
            case `checkbox`:
              n += t.checkbox(a);
              break;
            case `strong`:
              n += t.strong(a);
              break;
            case `em`:
              n += t.em(a);
              break;
            case `codespan`:
              n += t.codespan(a);
              break;
            case `br`:
              n += t.br(a);
              break;
            case `del`:
              n += t.del(a);
              break;
            case `text`:
              n += t.text(a);
              break;
            default: {
              let e = `Token with "` + a.type + `" type was not found.`;
              if (this.options.silent) return (console.error(e), ``);
              throw Error(e);
            }
          }
        }
        return n;
      }
    },
    eo = class {
      options;
      block;
      constructor(e) {
        this.options = e || Oi;
      }
      static passThroughHooks = new Set([
        `preprocess`,
        `postprocess`,
        `processAllTokens`,
        `emStrongMask`,
      ]);
      static passThroughHooksRespectAsync = new Set([
        `preprocess`,
        `postprocess`,
        `processAllTokens`,
      ]);
      preprocess(e) {
        return e;
      }
      postprocess(e) {
        return e;
      }
      processAllTokens(e) {
        return e;
      }
      emStrongMask(e) {
        return e;
      }
      provideLexer(e = this.block) {
        return e ? Xa.lex : Xa.lexInline;
      }
      provideParser(e = this.block) {
        return e ? $a.parse : $a.parseInline;
      }
    },
    to = new (class {
      defaults = Di();
      options = this.setOptions;
      parse = this.parseMarkdown(!0);
      parseInline = this.parseMarkdown(!1);
      Parser = $a;
      Renderer = Za;
      TextRenderer = Qa;
      Lexer = Xa;
      Tokenizer = Ya;
      Hooks = eo;
      constructor(...e) {
        this.use(...e);
      }
      walkTokens(e, t) {
        let n = [];
        for (let r of e)
          switch (((n = n.concat(t.call(this, r))), r.type)) {
            case `table`: {
              let e = r;
              for (let r of e.header)
                n = n.concat(this.walkTokens(r.tokens, t));
              for (let r of e.rows)
                for (let e of r) n = n.concat(this.walkTokens(e.tokens, t));
              break;
            }
            case `list`: {
              let e = r;
              n = n.concat(this.walkTokens(e.items, t));
              break;
            }
            default: {
              let e = r;
              this.defaults.extensions?.childTokens?.[e.type]
                ? this.defaults.extensions.childTokens[e.type].forEach((r) => {
                    let i = e[r].flat(1 / 0);
                    n = n.concat(this.walkTokens(i, t));
                  })
                : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t)));
            }
          }
        return n;
      }
      use(...e) {
        let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
        return (
          e.forEach((e) => {
            let n = { ...e };
            if (
              ((n.async = this.defaults.async || n.async || !1),
              e.extensions &&
                (e.extensions.forEach((e) => {
                  if (!e.name) throw Error(`extension name required`);
                  if (`renderer` in e) {
                    let n = t.renderers[e.name];
                    n
                      ? (t.renderers[e.name] = function (...t) {
                          let r = e.renderer.apply(this, t);
                          return (r === !1 && (r = n.apply(this, t)), r);
                        })
                      : (t.renderers[e.name] = e.renderer);
                  }
                  if (`tokenizer` in e) {
                    if (
                      !e.level ||
                      (e.level !== `block` && e.level !== `inline`)
                    )
                      throw Error(
                        `extension level must be 'block' or 'inline'`,
                      );
                    let n = t[e.level];
                    (n ? n.unshift(e.tokenizer) : (t[e.level] = [e.tokenizer]),
                      e.start &&
                        (e.level === `block`
                          ? t.startBlock
                            ? t.startBlock.push(e.start)
                            : (t.startBlock = [e.start])
                          : e.level === `inline` &&
                            (t.startInline
                              ? t.startInline.push(e.start)
                              : (t.startInline = [e.start]))));
                  }
                  `childTokens` in e &&
                    e.childTokens &&
                    (t.childTokens[e.name] = e.childTokens);
                }),
                (n.extensions = t)),
              e.renderer)
            ) {
              let t = this.defaults.renderer || new Za(this.defaults);
              for (let n in e.renderer) {
                if (!(n in t)) throw Error(`renderer '${n}' does not exist`);
                if ([`options`, `parser`].includes(n)) continue;
                let r = n,
                  i = e.renderer[r],
                  a = t[r];
                t[r] = (...e) => {
                  let n = i.apply(t, e);
                  return (n === !1 && (n = a.apply(t, e)), n || ``);
                };
              }
              n.renderer = t;
            }
            if (e.tokenizer) {
              let t = this.defaults.tokenizer || new Ya(this.defaults);
              for (let n in e.tokenizer) {
                if (!(n in t)) throw Error(`tokenizer '${n}' does not exist`);
                if ([`options`, `rules`, `lexer`].includes(n)) continue;
                let r = n,
                  i = e.tokenizer[r],
                  a = t[r];
                t[r] = (...e) => {
                  let n = i.apply(t, e);
                  return (n === !1 && (n = a.apply(t, e)), n);
                };
              }
              n.tokenizer = t;
            }
            if (e.hooks) {
              let t = this.defaults.hooks || new eo();
              for (let n in e.hooks) {
                if (!(n in t)) throw Error(`hook '${n}' does not exist`);
                if ([`options`, `block`].includes(n)) continue;
                let r = n,
                  i = e.hooks[r],
                  a = t[r];
                eo.passThroughHooks.has(n)
                  ? (t[r] = (e) => {
                      if (
                        this.defaults.async &&
                        eo.passThroughHooksRespectAsync.has(n)
                      )
                        return (async () => {
                          let n = await i.call(t, e);
                          return a.call(t, n);
                        })();
                      let r = i.call(t, e);
                      return a.call(t, r);
                    })
                  : (t[r] = (...e) => {
                      if (this.defaults.async)
                        return (async () => {
                          let n = await i.apply(t, e);
                          return (n === !1 && (n = await a.apply(t, e)), n);
                        })();
                      let n = i.apply(t, e);
                      return (n === !1 && (n = a.apply(t, e)), n);
                    });
              }
              n.hooks = t;
            }
            if (e.walkTokens) {
              let t = this.defaults.walkTokens,
                r = e.walkTokens;
              n.walkTokens = function (e) {
                let n = [];
                return (
                  n.push(r.call(this, e)),
                  t && (n = n.concat(t.call(this, e))),
                  n
                );
              };
            }
            this.defaults = { ...this.defaults, ...n };
          }),
          this
        );
      }
      setOptions(e) {
        return ((this.defaults = { ...this.defaults, ...e }), this);
      }
      lexer(e, t) {
        return Xa.lex(e, t ?? this.defaults);
      }
      parser(e, t) {
        return $a.parse(e, t ?? this.defaults);
      }
      parseMarkdown(e) {
        return (t, n) => {
          let r = { ...n },
            i = { ...this.defaults, ...r },
            a = this.onError(!!i.silent, !!i.async);
          if (this.defaults.async === !0 && r.async === !1)
            return a(
              Error(
                `marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.`,
              ),
            );
          if (typeof t > `u` || t === null)
            return a(Error(`marked(): input parameter is undefined or null`));
          if (typeof t != `string`)
            return a(
              Error(
                `marked(): input parameter is of type ` +
                  Object.prototype.toString.call(t) +
                  `, string expected`,
              ),
            );
          if (
            (i.hooks && ((i.hooks.options = i), (i.hooks.block = e)), i.async)
          )
            return (async () => {
              let n = i.hooks ? await i.hooks.preprocess(t) : t,
                r = await (
                  i.hooks
                    ? await i.hooks.provideLexer(e)
                    : e
                      ? Xa.lex
                      : Xa.lexInline
                )(n, i),
                a = i.hooks ? await i.hooks.processAllTokens(r) : r;
              i.walkTokens &&
                (await Promise.all(this.walkTokens(a, i.walkTokens)));
              let o = await (
                i.hooks
                  ? await i.hooks.provideParser(e)
                  : e
                    ? $a.parse
                    : $a.parseInline
              )(a, i);
              return i.hooks ? await i.hooks.postprocess(o) : o;
            })().catch(a);
          try {
            i.hooks && (t = i.hooks.preprocess(t));
            let n = (
              i.hooks ? i.hooks.provideLexer(e) : e ? Xa.lex : Xa.lexInline
            )(t, i);
            (i.hooks && (n = i.hooks.processAllTokens(n)),
              i.walkTokens && this.walkTokens(n, i.walkTokens));
            let r = (
              i.hooks ? i.hooks.provideParser(e) : e ? $a.parse : $a.parseInline
            )(n, i);
            return (i.hooks && (r = i.hooks.postprocess(r)), r);
          } catch (e) {
            return a(e);
          }
        };
      }
      onError(e, t) {
        return (n) => {
          if (
            ((n.message += `
Please report this to https://github.com/markedjs/marked.`),
            e)
          ) {
            let e =
              `<p>An error occurred:</p><pre>` +
              Ba(n.message + ``, !0) +
              `</pre>`;
            return t ? Promise.resolve(e) : e;
          }
          if (t) return Promise.reject(n);
          throw n;
        };
      }
    })();
  function J(e, t) {
    return to.parse(e, t);
  }
  ((J.options = J.setOptions =
    function (e) {
      return (to.setOptions(e), (J.defaults = to.defaults), ki(J.defaults), J);
    }),
    (J.getDefaults = Di),
    (J.defaults = Oi),
    (J.use = function (...e) {
      return (to.use(...e), (J.defaults = to.defaults), ki(J.defaults), J);
    }),
    (J.walkTokens = function (e, t) {
      return to.walkTokens(e, t);
    }),
    (J.parseInline = to.parseInline),
    (J.Parser = $a),
    (J.parser = $a.parse),
    (J.Renderer = Za),
    (J.TextRenderer = Qa),
    (J.Lexer = Xa),
    (J.lexer = Xa.lex),
    (J.Tokenizer = Ya),
    (J.Hooks = eo),
    (J.parse = J),
    J.options,
    J.setOptions,
    J.use,
    J.walkTokens,
    J.parseInline,
    $a.parse,
    Xa.lex);
  function no(e, t) {
    (t == null || t > e.length) && (t = e.length);
    for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
    return r;
  }
  function ro(e) {
    if (Array.isArray(e)) return e;
  }
  function io(e, t) {
    var n =
      e == null
        ? null
        : (typeof Symbol < `u` && e[Symbol.iterator]) || e[`@@iterator`];
    if (n != null) {
      var r,
        i,
        a,
        o,
        s = [],
        c = !0,
        l = !1;
      try {
        if (((a = (n = n.call(e)).next), t !== 0))
          for (
            ;
            !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t);
            c = !0
          );
      } catch (e) {
        ((l = !0), (i = e));
      } finally {
        try {
          if (!c && n.return != null && ((o = n.return()), Object(o) !== o))
            return;
        } finally {
          if (l) throw i;
        }
      }
      return s;
    }
  }
  function ao() {
    throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
  }
  function oo(e, t) {
    return ro(e) || io(e, t) || so(e, t) || ao();
  }
  function so(e, t) {
    if (e) {
      if (typeof e == `string`) return no(e, t);
      var n = {}.toString.call(e).slice(8, -1);
      return (
        n === `Object` && e.constructor && (n = e.constructor.name),
        n === `Map` || n === `Set`
          ? Array.from(e)
          : n === `Arguments` ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
            ? no(e, t)
            : void 0
      );
    }
  }
  var co = Object.entries,
    lo = Object.setPrototypeOf,
    uo = Object.isFrozen,
    fo = Object.getPrototypeOf,
    po = Object.getOwnPropertyDescriptor,
    mo = Object.freeze,
    ho = Object.seal,
    go = Object.create,
    _o = typeof Reflect < `u` && Reflect,
    vo = _o.apply,
    yo = _o.construct;
  ((mo ||= function (e) {
    return e;
  }),
    (ho ||= function (e) {
      return e;
    }),
    (vo ||= function (e, t) {
      for (
        var n = arguments.length, r = Array(n > 2 ? n - 2 : 0), i = 2;
        i < n;
        i++
      )
        r[i - 2] = arguments[i];
      return e.apply(t, r);
    }),
    (yo ||= function (e) {
      for (
        var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1;
        r < t;
        r++
      )
        n[r - 1] = arguments[r];
      return new e(...n);
    }));
  var bo = Z(Array.prototype.forEach),
    xo = Z(Array.prototype.lastIndexOf),
    So = Z(Array.prototype.pop),
    Co = Z(Array.prototype.push),
    wo = Z(Array.prototype.splice),
    To = Array.isArray,
    Eo = Z(String.prototype.toLowerCase),
    Do = Z(String.prototype.toString),
    Oo = Z(String.prototype.match),
    ko = Z(String.prototype.replace),
    Ao = Z(String.prototype.indexOf),
    jo = Z(String.prototype.trim),
    Mo = Z(Number.prototype.toString),
    No = Z(Boolean.prototype.toString),
    Po = typeof BigInt > `u` ? null : Z(BigInt.prototype.toString),
    Fo = typeof Symbol > `u` ? null : Z(Symbol.prototype.toString),
    Y = Z(Object.prototype.hasOwnProperty),
    Io = Z(Object.prototype.toString),
    X = Z(RegExp.prototype.test),
    Lo = Ro(TypeError);
  function Z(e) {
    return function (t) {
      t instanceof RegExp && (t.lastIndex = 0);
      for (
        var n = arguments.length, r = Array(n > 1 ? n - 1 : 0), i = 1;
        i < n;
        i++
      )
        r[i - 1] = arguments[i];
      return vo(e, t, r);
    };
  }
  function Ro(e) {
    return function () {
      for (var t = arguments.length, n = Array(t), r = 0; r < t; r++)
        n[r] = arguments[r];
      return yo(e, n);
    };
  }
  function Q(e, t) {
    let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Eo;
    if ((lo && lo(e, null), !To(t))) return e;
    let r = t.length;
    for (; r--; ) {
      let i = t[r];
      if (typeof i == `string`) {
        let e = n(i);
        e !== i && (uo(t) || (t[r] = e), (i = e));
      }
      e[i] = !0;
    }
    return e;
  }
  function zo(e) {
    for (let t = 0; t < e.length; t++) Y(e, t) || (e[t] = null);
    return e;
  }
  function $(e) {
    let t = go(null);
    for (let r of co(e)) {
      var n = oo(r, 2);
      let i = n[0],
        a = n[1];
      Y(e, i) &&
        (To(a)
          ? (t[i] = zo(a))
          : a && typeof a == `object` && a.constructor === Object
            ? (t[i] = $(a))
            : (t[i] = a));
    }
    return t;
  }
  function Bo(e) {
    switch (typeof e) {
      case `string`:
        return e;
      case `number`:
        return Mo(e);
      case `boolean`:
        return No(e);
      case `bigint`:
        return Po ? Po(e) : `0`;
      case `symbol`:
        return Fo ? Fo(e) : `Symbol()`;
      case `undefined`:
        return Io(e);
      case `function`:
      case `object`: {
        if (e === null) return Io(e);
        let t = e,
          n = Vo(t, `toString`);
        if (typeof n == `function`) {
          let e = n(t);
          return typeof e == `string` ? e : Io(e);
        }
        return Io(e);
      }
      default:
        return Io(e);
    }
  }
  function Vo(e, t) {
    for (; e !== null; ) {
      let n = po(e, t);
      if (n) {
        if (n.get) return Z(n.get);
        if (typeof n.value == `function`) return Z(n.value);
      }
      e = fo(e);
    }
    function n() {
      return null;
    }
    return n;
  }
  function Ho(e) {
    try {
      return (X(e, ``), !0);
    } catch {
      return !1;
    }
  }
  var Uo = mo(
      `a.abbr.acronym.address.area.article.aside.audio.b.bdi.bdo.big.blink.blockquote.body.br.button.canvas.caption.center.cite.code.col.colgroup.content.data.datalist.dd.decorator.del.details.dfn.dialog.dir.div.dl.dt.element.em.fieldset.figcaption.figure.font.footer.form.h1.h2.h3.h4.h5.h6.head.header.hgroup.hr.html.i.img.input.ins.kbd.label.legend.li.main.map.mark.marquee.menu.menuitem.meter.nav.nobr.ol.optgroup.option.output.p.picture.pre.progress.q.rp.rt.ruby.s.samp.search.section.select.shadow.slot.small.source.spacer.span.strike.strong.style.sub.summary.sup.table.tbody.td.template.textarea.tfoot.th.thead.time.tr.track.tt.u.ul.var.video.wbr`.split(
        `.`,
      ),
    ),
    Wo = mo(
      `svg.a.altglyph.altglyphdef.altglyphitem.animatecolor.animatemotion.animatetransform.circle.clippath.defs.desc.ellipse.enterkeyhint.exportparts.filter.font.g.glyph.glyphref.hkern.image.inputmode.line.lineargradient.marker.mask.metadata.mpath.part.path.pattern.polygon.polyline.radialgradient.rect.stop.style.switch.symbol.text.textpath.title.tref.tspan.view.vkern`.split(
        `.`,
      ),
    ),
    Go = mo([
      `feBlend`,
      `feColorMatrix`,
      `feComponentTransfer`,
      `feComposite`,
      `feConvolveMatrix`,
      `feDiffuseLighting`,
      `feDisplacementMap`,
      `feDistantLight`,
      `feDropShadow`,
      `feFlood`,
      `feFuncA`,
      `feFuncB`,
      `feFuncG`,
      `feFuncR`,
      `feGaussianBlur`,
      `feImage`,
      `feMerge`,
      `feMergeNode`,
      `feMorphology`,
      `feOffset`,
      `fePointLight`,
      `feSpecularLighting`,
      `feSpotLight`,
      `feTile`,
      `feTurbulence`,
    ]),
    Ko = mo([
      `animate`,
      `color-profile`,
      `cursor`,
      `discard`,
      `font-face`,
      `font-face-format`,
      `font-face-name`,
      `font-face-src`,
      `font-face-uri`,
      `foreignobject`,
      `hatch`,
      `hatchpath`,
      `mesh`,
      `meshgradient`,
      `meshpatch`,
      `meshrow`,
      `missing-glyph`,
      `script`,
      `set`,
      `solidcolor`,
      `unknown`,
      `use`,
    ]),
    qo = mo(
      `math.menclose.merror.mfenced.mfrac.mglyph.mi.mlabeledtr.mmultiscripts.mn.mo.mover.mpadded.mphantom.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msup.msubsup.mtable.mtd.mtext.mtr.munder.munderover.mprescripts`.split(
        `.`,
      ),
    ),
    Jo = mo([
      `maction`,
      `maligngroup`,
      `malignmark`,
      `mlongdiv`,
      `mscarries`,
      `mscarry`,
      `msgroup`,
      `mstack`,
      `msline`,
      `msrow`,
      `semantics`,
      `annotation`,
      `annotation-xml`,
      `mprescripts`,
      `none`,
    ]),
    Yo = mo([`#text`]),
    Xo = mo(
      `accept.action.align.alt.autocapitalize.autocomplete.autopictureinpicture.autoplay.background.bgcolor.border.capture.cellpadding.cellspacing.checked.cite.class.clear.color.cols.colspan.command.commandfor.controls.controlslist.coords.crossorigin.datetime.decoding.default.dir.disabled.disablepictureinpicture.disableremoteplayback.download.draggable.enctype.enterkeyhint.exportparts.face.for.headers.height.hidden.high.href.hreflang.id.inert.inputmode.integrity.ismap.kind.label.lang.list.loading.loop.low.max.maxlength.media.method.min.minlength.multiple.muted.name.nonce.noshade.novalidate.nowrap.open.optimum.part.pattern.placeholder.playsinline.popover.popovertarget.popovertargetaction.poster.preload.pubdate.radiogroup.readonly.rel.required.rev.reversed.role.rows.rowspan.spellcheck.scope.selected.shape.size.sizes.slot.span.srclang.start.src.srcset.step.style.summary.tabindex.title.translate.type.usemap.valign.value.width.wrap.xmlns`.split(
        `.`,
      ),
    ),
    Zo = mo(
      `accent-height.accumulate.additive.alignment-baseline.amplitude.ascent.attributename.attributetype.azimuth.basefrequency.baseline-shift.begin.bias.by.class.clip.clippathunits.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-profile.color-rendering.cx.cy.d.dx.dy.diffuseconstant.direction.display.divisor.dur.edgemode.elevation.end.exponent.fill.fill-opacity.fill-rule.filter.filterunits.flood-color.flood-opacity.font-family.font-size.font-size-adjust.font-stretch.font-style.font-variant.font-weight.fx.fy.g1.g2.glyph-name.glyphref.gradientunits.gradienttransform.height.href.id.image-rendering.in.in2.intercept.k.k1.k2.k3.k4.kerning.keypoints.keysplines.keytimes.lang.lengthadjust.letter-spacing.kernelmatrix.kernelunitlength.lighting-color.local.marker-end.marker-mid.marker-start.markerheight.markerunits.markerwidth.maskcontentunits.maskunits.max.mask.mask-type.media.method.mode.min.name.numoctaves.offset.operator.opacity.order.orient.orientation.origin.overflow.paint-order.path.pathlength.patterncontentunits.patterntransform.patternunits.points.preservealpha.preserveaspectratio.primitiveunits.r.rx.ry.radius.refx.refy.repeatcount.repeatdur.restart.result.rotate.scale.seed.shape-rendering.slope.specularconstant.specularexponent.spreadmethod.startoffset.stddeviation.stitchtiles.stop-color.stop-opacity.stroke-dasharray.stroke-dashoffset.stroke-linecap.stroke-linejoin.stroke-miterlimit.stroke-opacity.stroke.stroke-width.style.surfacescale.systemlanguage.tabindex.tablevalues.targetx.targety.transform.transform-origin.text-anchor.text-decoration.text-rendering.textlength.type.u1.u2.unicode.values.viewbox.visibility.version.vert-adv-y.vert-origin-x.vert-origin-y.width.word-spacing.wrap.writing-mode.xchannelselector.ychannelselector.x.x1.x2.xmlns.y.y1.y2.z.zoomandpan`.split(
        `.`,
      ),
    ),
    Qo = mo(
      `accent.accentunder.align.bevelled.close.columnalign.columnlines.columnspacing.columnspan.denomalign.depth.dir.display.displaystyle.encoding.fence.frame.height.href.id.largeop.length.linethickness.lquote.lspace.mathbackground.mathcolor.mathsize.mathvariant.maxsize.minsize.movablelimits.notation.numalign.open.rowalign.rowlines.rowspacing.rowspan.rspace.rquote.scriptlevel.scriptminsize.scriptsizemultiplier.selection.separator.separators.stretchy.subscriptshift.supscriptshift.symmetric.voffset.width.xmlns`.split(
        `.`,
      ),
    ),
    $o = mo([
      `xlink:href`,
      `xml:id`,
      `xlink:title`,
      `xml:space`,
      `xmlns:xlink`,
    ]),
    es = ho(/{{[\w\W]*|^[\w\W]*}}/g),
    ts = ho(/<%[\w\W]*|^[\w\W]*%>/g),
    ns = ho(/\${[\w\W]*/g),
    rs = ho(/^data-[\-\w.\u00B7-\uFFFF]+$/),
    is = ho(/^aria-[\-\w]+$/),
    as = ho(
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ),
    os = ho(/^(?:\w+script|data):/i),
    ss = ho(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),
    cs = ho(/^html$/i),
    ls = ho(/^[a-z][.\w]*(-[.\w]+)+$/i),
    us = {
      element: 1,
      attribute: 2,
      text: 3,
      cdataSection: 4,
      entityReference: 5,
      entityNode: 6,
      progressingInstruction: 7,
      comment: 8,
      document: 9,
      documentType: 10,
      documentFragment: 11,
      notation: 12,
    },
    ds = function () {
      return typeof window > `u` ? null : window;
    },
    fs = function (e, t) {
      if (typeof e != `object` || typeof e.createPolicy != `function`)
        return null;
      let n = null,
        r = `data-tt-policy-suffix`;
      t && t.hasAttribute(r) && (n = t.getAttribute(r));
      let i = `dompurify` + (n ? `#` + n : ``);
      try {
        return e.createPolicy(i, {
          createHTML(e) {
            return e;
          },
          createScriptURL(e) {
            return e;
          },
        });
      } catch {
        return (
          console.warn(`TrustedTypes policy ` + i + ` could not be created.`),
          null
        );
      }
    },
    ps = function () {
      return {
        afterSanitizeAttributes: [],
        afterSanitizeElements: [],
        afterSanitizeShadowDOM: [],
        beforeSanitizeAttributes: [],
        beforeSanitizeElements: [],
        beforeSanitizeShadowDOM: [],
        uponSanitizeAttribute: [],
        uponSanitizeElement: [],
        uponSanitizeShadowNode: [],
      };
    };
  function ms() {
    let e =
        arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : ds(),
      t = (e) => ms(e);
    if (
      ((t.version = `3.4.9`),
      (t.removed = []),
      !e || !e.document || e.document.nodeType !== us.document || !e.Element)
    )
      return ((t.isSupported = !1), t);
    let n = e.document,
      r = n,
      i = r.currentScript;
    e.DocumentFragment;
    let a = e.HTMLTemplateElement,
      o = e.Node,
      s = e.Element,
      c = e.NodeFilter;
    (e.NamedNodeMap === void 0 && (e.NamedNodeMap || e.MozNamedAttrMap),
      e.HTMLFormElement);
    let l = e.DOMParser,
      u = e.trustedTypes,
      d = s.prototype,
      f = Vo(d, `cloneNode`),
      p = Vo(d, `remove`),
      m = Vo(d, `nextSibling`),
      h = Vo(d, `childNodes`),
      g = Vo(d, `parentNode`),
      _ = Vo(d, `shadowRoot`),
      v = Vo(d, `attributes`),
      y = o && o.prototype ? Vo(o.prototype, `nodeType`) : null,
      b = o && o.prototype ? Vo(o.prototype, `nodeName`) : null;
    if (typeof a == `function`) {
      let e = n.createElement(`template`);
      e.content && e.content.ownerDocument && (n = e.content.ownerDocument);
    }
    let x,
      S = ``,
      C,
      ee = !1,
      w = 0,
      te = function () {
        if (w > 0)
          throw Lo(
            `A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.`,
          );
      },
      ne = function (e) {
        (te(), w++);
        try {
          return x.createHTML(e);
        } finally {
          w--;
        }
      },
      re = function (e) {
        (te(), w++);
        try {
          return x.createScriptURL(e);
        } finally {
          w--;
        }
      },
      ie = function () {
        return ((ee ||= ((C = fs(u, i)), !0)), C);
      },
      ae = n,
      oe = ae.implementation,
      se = ae.createNodeIterator,
      ce = ae.createDocumentFragment,
      le = ae.getElementsByTagName,
      ue = r.importNode,
      T = ps();
    t.isSupported =
      typeof co == `function` &&
      typeof g == `function` &&
      oe &&
      oe.createHTMLDocument !== void 0;
    let de = es,
      fe = ts,
      pe = ns,
      me = rs,
      he = is,
      ge = os,
      _e = ss,
      ve = ls,
      ye = as,
      E = null,
      be = Q({}, [...Uo, ...Wo, ...Go, ...qo, ...Yo]),
      D = null,
      xe = Q({}, [...Xo, ...Zo, ...Qo, ...$o]),
      O = Object.seal(
        go(null, {
          tagNameCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null,
          },
          attributeNameCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null,
          },
          allowCustomizedBuiltInElements: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: !1,
          },
        }),
      ),
      Se = null,
      Ce = null,
      we = Object.seal(
        go(null, {
          tagCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null,
          },
          attributeCheck: {
            writable: !0,
            configurable: !1,
            enumerable: !0,
            value: null,
          },
        }),
      ),
      Te = !0,
      Ee = !0,
      De = !1,
      Oe = !0,
      ke = !1,
      Ae = !0,
      je = !1,
      Me = !1,
      k = !1,
      Ne = !1,
      A = !1,
      j = !1,
      Pe = !0,
      M = !1,
      Fe = `user-content-`,
      Ie = !0,
      Le = !1,
      Re = {},
      ze = null,
      Be = Q(
        {},
        `annotation-xml.audio.colgroup.desc.foreignobject.head.iframe.math.mi.mn.mo.ms.mtext.noembed.noframes.noscript.plaintext.script.selectedcontent.style.svg.template.thead.title.video.xmp`.split(
          `.`,
        ),
      ),
      Ve = null,
      He = Q({}, [`audio`, `video`, `img`, `source`, `image`, `track`]),
      N = null,
      Ue = Q({}, [
        `alt`,
        `class`,
        `for`,
        `id`,
        `label`,
        `name`,
        `pattern`,
        `placeholder`,
        `role`,
        `summary`,
        `title`,
        `value`,
        `style`,
        `xmlns`,
      ]),
      We = `http://www.w3.org/1998/Math/MathML`,
      Ge = `http://www.w3.org/2000/svg`,
      Ke = `http://www.w3.org/1999/xhtml`,
      qe = Ke,
      Je = !1,
      Ye = null,
      Xe = Q({}, [We, Ge, Ke], Do),
      Ze = Q({}, [`mi`, `mo`, `mn`, `ms`, `mtext`]),
      Qe = Q({}, [`annotation-xml`]),
      $e = Q({}, [`title`, `style`, `font`, `a`, `script`]),
      P = null,
      et = [`application/xhtml+xml`, `text/html`],
      F = null,
      tt = null,
      nt = n.createElement(`form`),
      rt = function (e) {
        return e instanceof RegExp || e instanceof Function;
      },
      it = function () {
        let e =
          arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        if (tt && tt === e) return;
        ((!e || typeof e != `object`) && (e = {}),
          (e = $(e)),
          (P =
            et.indexOf(e.PARSER_MEDIA_TYPE) === -1
              ? `text/html`
              : e.PARSER_MEDIA_TYPE),
          (F = P === `application/xhtml+xml` ? Do : Eo),
          (E =
            Y(e, `ALLOWED_TAGS`) && To(e.ALLOWED_TAGS)
              ? Q({}, e.ALLOWED_TAGS, F)
              : be),
          (D =
            Y(e, `ALLOWED_ATTR`) && To(e.ALLOWED_ATTR)
              ? Q({}, e.ALLOWED_ATTR, F)
              : xe),
          (Ye =
            Y(e, `ALLOWED_NAMESPACES`) && To(e.ALLOWED_NAMESPACES)
              ? Q({}, e.ALLOWED_NAMESPACES, Do)
              : Xe),
          (N =
            Y(e, `ADD_URI_SAFE_ATTR`) && To(e.ADD_URI_SAFE_ATTR)
              ? Q($(Ue), e.ADD_URI_SAFE_ATTR, F)
              : Ue),
          (Ve =
            Y(e, `ADD_DATA_URI_TAGS`) && To(e.ADD_DATA_URI_TAGS)
              ? Q($(He), e.ADD_DATA_URI_TAGS, F)
              : He),
          (ze =
            Y(e, `FORBID_CONTENTS`) && To(e.FORBID_CONTENTS)
              ? Q({}, e.FORBID_CONTENTS, F)
              : Be),
          (Se =
            Y(e, `FORBID_TAGS`) && To(e.FORBID_TAGS)
              ? Q({}, e.FORBID_TAGS, F)
              : $({})),
          (Ce =
            Y(e, `FORBID_ATTR`) && To(e.FORBID_ATTR)
              ? Q({}, e.FORBID_ATTR, F)
              : $({})),
          (Re = Y(e, `USE_PROFILES`)
            ? e.USE_PROFILES && typeof e.USE_PROFILES == `object`
              ? $(e.USE_PROFILES)
              : e.USE_PROFILES
            : !1),
          (Te = e.ALLOW_ARIA_ATTR !== !1),
          (Ee = e.ALLOW_DATA_ATTR !== !1),
          (De = e.ALLOW_UNKNOWN_PROTOCOLS || !1),
          (Oe = e.ALLOW_SELF_CLOSE_IN_ATTR !== !1),
          (ke = e.SAFE_FOR_TEMPLATES || !1),
          (Ae = e.SAFE_FOR_XML !== !1),
          (je = e.WHOLE_DOCUMENT || !1),
          (Ne = e.RETURN_DOM || !1),
          (A = e.RETURN_DOM_FRAGMENT || !1),
          (j = e.RETURN_TRUSTED_TYPE || !1),
          (k = e.FORCE_BODY || !1),
          (Pe = e.SANITIZE_DOM !== !1),
          (M = e.SANITIZE_NAMED_PROPS || !1),
          (Ie = e.KEEP_CONTENT !== !1),
          (Le = e.IN_PLACE || !1),
          (ye = Ho(e.ALLOWED_URI_REGEXP) ? e.ALLOWED_URI_REGEXP : as),
          (qe = typeof e.NAMESPACE == `string` ? e.NAMESPACE : Ke),
          (Ze =
            Y(e, `MATHML_TEXT_INTEGRATION_POINTS`) &&
            e.MATHML_TEXT_INTEGRATION_POINTS &&
            typeof e.MATHML_TEXT_INTEGRATION_POINTS == `object`
              ? $(e.MATHML_TEXT_INTEGRATION_POINTS)
              : Q({}, [`mi`, `mo`, `mn`, `ms`, `mtext`])),
          (Qe =
            Y(e, `HTML_INTEGRATION_POINTS`) &&
            e.HTML_INTEGRATION_POINTS &&
            typeof e.HTML_INTEGRATION_POINTS == `object`
              ? $(e.HTML_INTEGRATION_POINTS)
              : Q({}, [`annotation-xml`])));
        let t =
          Y(e, `CUSTOM_ELEMENT_HANDLING`) &&
          e.CUSTOM_ELEMENT_HANDLING &&
          typeof e.CUSTOM_ELEMENT_HANDLING == `object`
            ? $(e.CUSTOM_ELEMENT_HANDLING)
            : go(null);
        if (
          ((O = go(null)),
          Y(t, `tagNameCheck`) &&
            rt(t.tagNameCheck) &&
            (O.tagNameCheck = t.tagNameCheck),
          Y(t, `attributeNameCheck`) &&
            rt(t.attributeNameCheck) &&
            (O.attributeNameCheck = t.attributeNameCheck),
          Y(t, `allowCustomizedBuiltInElements`) &&
            typeof t.allowCustomizedBuiltInElements == `boolean` &&
            (O.allowCustomizedBuiltInElements =
              t.allowCustomizedBuiltInElements),
          ke && (Ee = !1),
          A && (Ne = !0),
          Re &&
            ((E = Q({}, Yo)),
            (D = go(null)),
            Re.html === !0 && (Q(E, Uo), Q(D, Xo)),
            Re.svg === !0 && (Q(E, Wo), Q(D, Zo), Q(D, $o)),
            Re.svgFilters === !0 && (Q(E, Go), Q(D, Zo), Q(D, $o)),
            Re.mathMl === !0 && (Q(E, qo), Q(D, Qo), Q(D, $o))),
          (we.tagCheck = null),
          (we.attributeCheck = null),
          Y(e, `ADD_TAGS`) &&
            (typeof e.ADD_TAGS == `function`
              ? (we.tagCheck = e.ADD_TAGS)
              : To(e.ADD_TAGS) &&
                (E === be && (E = $(E)), Q(E, e.ADD_TAGS, F))),
          Y(e, `ADD_ATTR`) &&
            (typeof e.ADD_ATTR == `function`
              ? (we.attributeCheck = e.ADD_ATTR)
              : To(e.ADD_ATTR) &&
                (D === xe && (D = $(D)), Q(D, e.ADD_ATTR, F))),
          Y(e, `ADD_URI_SAFE_ATTR`) &&
            To(e.ADD_URI_SAFE_ATTR) &&
            Q(N, e.ADD_URI_SAFE_ATTR, F),
          Y(e, `FORBID_CONTENTS`) &&
            To(e.FORBID_CONTENTS) &&
            (ze === Be && (ze = $(ze)), Q(ze, e.FORBID_CONTENTS, F)),
          Y(e, `ADD_FORBID_CONTENTS`) &&
            To(e.ADD_FORBID_CONTENTS) &&
            (ze === Be && (ze = $(ze)), Q(ze, e.ADD_FORBID_CONTENTS, F)),
          Ie && (E[`#text`] = !0),
          je && Q(E, [`html`, `head`, `body`]),
          E.table && (Q(E, [`tbody`]), delete Se.tbody),
          e.TRUSTED_TYPES_POLICY)
        ) {
          if (typeof e.TRUSTED_TYPES_POLICY.createHTML != `function`)
            throw Lo(
              `TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.`,
            );
          if (typeof e.TRUSTED_TYPES_POLICY.createScriptURL != `function`)
            throw Lo(
              `TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.`,
            );
          let t = x;
          x = e.TRUSTED_TYPES_POLICY;
          try {
            S = ne(``);
          } catch (e) {
            throw ((x = t), e);
          }
        } else
          e.TRUSTED_TYPES_POLICY === null
            ? ((x = void 0), (S = ``))
            : (x === void 0 && (x = ie()),
              x && typeof S == `string` && (S = ne(``)));
        ((T.uponSanitizeElement.length > 0 ||
          T.uponSanitizeAttribute.length > 0) &&
          E === be &&
          (E = $(E)),
          T.uponSanitizeAttribute.length > 0 && D === xe && (D = $(D)),
          mo && mo(e),
          (tt = e));
      },
      at = Q({}, [...Wo, ...Go, ...Ko]),
      ot = Q({}, [...qo, ...Jo]),
      st = function (e) {
        let t = g(e);
        (!t || !t.tagName) && (t = { namespaceURI: qe, tagName: `template` });
        let n = Eo(e.tagName),
          r = Eo(t.tagName);
        return Ye[e.namespaceURI]
          ? e.namespaceURI === Ge
            ? t.namespaceURI === Ke
              ? n === `svg`
              : t.namespaceURI === We
                ? n === `svg` && (r === `annotation-xml` || Ze[r])
                : !!at[n]
            : e.namespaceURI === We
              ? t.namespaceURI === Ke
                ? n === `math`
                : t.namespaceURI === Ge
                  ? n === `math` && Qe[r]
                  : !!ot[n]
              : e.namespaceURI === Ke
                ? (t.namespaceURI === Ge && !Qe[r]) ||
                  (t.namespaceURI === We && !Ze[r])
                  ? !1
                  : !ot[n] && ($e[n] || !at[n])
                : !!(P === `application/xhtml+xml` && Ye[e.namespaceURI])
          : !1;
      },
      ct = function (e) {
        Co(t.removed, { element: e });
        try {
          g(e).removeChild(e);
        } catch {
          if ((p(e), !g(e)))
            throw Lo(
              `a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place`,
            );
        }
      },
      lt = function (e) {
        let t = h ? h(e) : e.childNodes;
        if (t) {
          let e = [];
          (bo(t, (t) => {
            Co(e, t);
          }),
            bo(e, (e) => {
              try {
                p(e);
              } catch {}
            }));
        }
        let n = v ? v(e) : null;
        if (n)
          for (let t = n.length - 1; t >= 0; --t) {
            let r = n[t],
              i = r && r.name;
            if (typeof i == `string`)
              try {
                e.removeAttribute(i);
              } catch {}
          }
      },
      ut = function (e, n) {
        try {
          Co(t.removed, { attribute: n.getAttributeNode(e), from: n });
        } catch {
          Co(t.removed, { attribute: null, from: n });
        }
        if ((n.removeAttribute(e), e === `is`))
          if (Ne || A)
            try {
              ct(n);
            } catch {}
          else
            try {
              n.setAttribute(e, ``);
            } catch {}
      },
      dt = function (e) {
        let t = v ? v(e) : e.attributes;
        if (t)
          for (let n = t.length - 1; n >= 0; --n) {
            let r = t[n],
              i = r && r.name;
            if (!(typeof i != `string` || D[F(i)]))
              try {
                e.removeAttribute(i);
              } catch {}
          }
      },
      ft = function (e) {
        let t = [e];
        for (; t.length > 0; ) {
          let e = t.pop();
          (y ? y(e) : e.nodeType) === us.element && dt(e);
          let n = h ? h(e) : e.childNodes;
          if (n) for (let e = n.length - 1; e >= 0; --e) t.push(n[e]);
        }
      },
      pt = function (e) {
        let t = null,
          r = null;
        if (k) e = `<remove></remove>` + e;
        else {
          let t = Oo(e, /^[\r\n\t ]+/);
          r = t && t[0];
        }
        P === `application/xhtml+xml` &&
          qe === Ke &&
          (e =
            `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>` +
            e +
            `</body></html>`);
        let i = x ? ne(e) : e;
        if (qe === Ke)
          try {
            t = new l().parseFromString(i, P);
          } catch {}
        if (!t || !t.documentElement) {
          t = oe.createDocument(qe, `template`, null);
          try {
            t.documentElement.innerHTML = Je ? S : i;
          } catch {}
        }
        let a = t.body || t.documentElement;
        return (
          e &&
            r &&
            a.insertBefore(n.createTextNode(r), a.childNodes[0] || null),
          qe === Ke
            ? le.call(t, je ? `html` : `body`)[0]
            : je
              ? t.documentElement
              : a
        );
      },
      mt = function (e) {
        return se.call(
          e.ownerDocument || e,
          e,
          c.SHOW_ELEMENT |
            c.SHOW_COMMENT |
            c.SHOW_TEXT |
            c.SHOW_PROCESSING_INSTRUCTION |
            c.SHOW_CDATA_SECTION,
          null,
        );
      },
      ht = function (e) {
        e.normalize();
        let t = se.call(
            e.ownerDocument || e,
            e,
            c.SHOW_TEXT |
              c.SHOW_COMMENT |
              c.SHOW_CDATA_SECTION |
              c.SHOW_PROCESSING_INSTRUCTION,
            null,
          ),
          n = t.nextNode();
        for (; n; ) {
          let e = n.data;
          (bo([de, fe, pe], (t) => {
            e = ko(e, t, ` `);
          }),
            (n.data = e),
            (n = t.nextNode()));
        }
        let r = e.querySelectorAll?.call(e, `template`) ?? [];
        bo(Array.from(r), (e) => {
          _t(e.content) && ht(e.content);
        });
      },
      gt = function (e) {
        let t = b ? b(e) : null;
        return typeof t != `string` || F(t) !== `form`
          ? !1
          : typeof e.nodeName != `string` ||
              typeof e.textContent != `string` ||
              typeof e.removeChild != `function` ||
              e.attributes !== v(e) ||
              typeof e.removeAttribute != `function` ||
              typeof e.setAttribute != `function` ||
              typeof e.namespaceURI != `string` ||
              typeof e.insertBefore != `function` ||
              typeof e.hasChildNodes != `function` ||
              e.nodeType !== y(e) ||
              e.childNodes !== h(e);
      },
      _t = function (e) {
        if (!y || typeof e != `object` || !e) return !1;
        try {
          return y(e) === us.documentFragment;
        } catch {
          return !1;
        }
      },
      vt = function (e) {
        if (!y || typeof e != `object` || !e) return !1;
        try {
          return typeof y(e) == `number`;
        } catch {
          return !1;
        }
      };
    function yt(e, n, r) {
      bo(e, (e) => {
        e.call(t, n, r, tt);
      });
    }
    let bt = function (e) {
        let n = null;
        if ((yt(T.beforeSanitizeElements, e, null), gt(e))) return (ct(e), !0);
        let r = F(b ? b(e) : e.nodeName);
        if (
          (yt(T.uponSanitizeElement, e, { tagName: r, allowedTags: E }),
          (Ae &&
            e.hasChildNodes() &&
            !vt(e.firstElementChild) &&
            X(/<[/\w!]/g, e.innerHTML) &&
            X(/<[/\w!]/g, e.textContent)) ||
            (Ae &&
              e.namespaceURI === Ke &&
              r === `style` &&
              vt(e.firstElementChild)) ||
            e.nodeType === us.progressingInstruction ||
            (Ae && e.nodeType === us.comment && X(/<[/\w]/g, e.data)))
        )
          return (ct(e), !0);
        if (
          Se[r] ||
          (!(we.tagCheck instanceof Function && we.tagCheck(r)) && !E[r])
        ) {
          if (
            !Se[r] &&
            Ct(r) &&
            ((O.tagNameCheck instanceof RegExp && X(O.tagNameCheck, r)) ||
              (O.tagNameCheck instanceof Function && O.tagNameCheck(r)))
          )
            return !1;
          if (Ie && !ze[r]) {
            let t = g(e),
              n = h(e);
            if (n && t) {
              let r = n.length;
              for (let i = r - 1; i >= 0; --i) {
                let r = Le ? n[i] : f(n[i], !0);
                t.insertBefore(r, m(e));
              }
            }
          }
          return (ct(e), !0);
        }
        return ((y ? y(e) : e.nodeType) === us.element && !st(e)) ||
          ((r === `noscript` || r === `noembed` || r === `noframes`) &&
            X(/<\/no(script|embed|frames)/i, e.innerHTML))
          ? (ct(e), !0)
          : (ke &&
              e.nodeType === us.text &&
              ((n = e.textContent),
              bo([de, fe, pe], (e) => {
                n = ko(n, e, ` `);
              }),
              e.textContent !== n &&
                (Co(t.removed, { element: e.cloneNode() }),
                (e.textContent = n))),
            yt(T.afterSanitizeElements, e, null),
            !1);
      },
      xt = function (e, t, r) {
        if (
          Ce[t] ||
          (Pe && (t === `id` || t === `name`) && (r in n || r in nt))
        )
          return !1;
        let i =
          D[t] ||
          (we.attributeCheck instanceof Function && we.attributeCheck(t, e));
        if (!(Ee && !Ce[t] && X(me, t)) && !(Te && X(he, t))) {
          if (!i || Ce[t]) {
            if (
              !(
                (Ct(e) &&
                  ((O.tagNameCheck instanceof RegExp && X(O.tagNameCheck, e)) ||
                    (O.tagNameCheck instanceof Function &&
                      O.tagNameCheck(e))) &&
                  ((O.attributeNameCheck instanceof RegExp &&
                    X(O.attributeNameCheck, t)) ||
                    (O.attributeNameCheck instanceof Function &&
                      O.attributeNameCheck(t, e)))) ||
                (t === `is` &&
                  O.allowCustomizedBuiltInElements &&
                  ((O.tagNameCheck instanceof RegExp && X(O.tagNameCheck, r)) ||
                    (O.tagNameCheck instanceof Function && O.tagNameCheck(r))))
              )
            )
              return !1;
          } else if (
            !N[t] &&
            !X(ye, ko(r, _e, ``)) &&
            !(
              (t === `src` || t === `xlink:href` || t === `href`) &&
              e !== `script` &&
              Ao(r, `data:`) === 0 &&
              Ve[e]
            ) &&
            !(De && !X(ge, ko(r, _e, ``))) &&
            r
          )
            return !1;
        }
        return !0;
      },
      St = Q({}, [
        `annotation-xml`,
        `color-profile`,
        `font-face`,
        `font-face-format`,
        `font-face-name`,
        `font-face-src`,
        `font-face-uri`,
        `missing-glyph`,
      ]),
      Ct = function (e) {
        return !St[Eo(e)] && X(ve, e);
      },
      wt = function (e) {
        yt(T.beforeSanitizeAttributes, e, null);
        let n = e.attributes;
        if (!n || gt(e)) return;
        let r = {
            attrName: ``,
            attrValue: ``,
            keepAttr: !0,
            allowedAttributes: D,
            forceKeepAttr: void 0,
          },
          i = n.length;
        for (; i--; ) {
          let a = n[i],
            o = a.name,
            s = a.namespaceURI,
            c = a.value,
            l = F(o),
            d = c,
            f = o === `value` ? d : jo(d);
          if (
            ((r.attrName = l),
            (r.attrValue = f),
            (r.keepAttr = !0),
            (r.forceKeepAttr = void 0),
            yt(T.uponSanitizeAttribute, e, r),
            (f = r.attrValue),
            M &&
              (l === `id` || l === `name`) &&
              Ao(f, Fe) !== 0 &&
              (ut(o, e), (f = Fe + f)),
            Ae &&
              X(
                /((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,
                f,
              ))
          ) {
            ut(o, e);
            continue;
          }
          if (l === `attributename` && Oo(f, `href`)) {
            ut(o, e);
            continue;
          }
          if (r.forceKeepAttr) continue;
          if (!r.keepAttr) {
            ut(o, e);
            continue;
          }
          if (!Oe && X(/\/>/i, f)) {
            ut(o, e);
            continue;
          }
          ke &&
            bo([de, fe, pe], (e) => {
              f = ko(f, e, ` `);
            });
          let p = F(e.nodeName);
          if (!xt(p, l, f)) {
            ut(o, e);
            continue;
          }
          if (
            x &&
            typeof u == `object` &&
            typeof u.getAttributeType == `function` &&
            !s
          )
            switch (u.getAttributeType(p, l)) {
              case `TrustedHTML`:
                f = ne(f);
                break;
              case `TrustedScriptURL`:
                f = re(f);
                break;
            }
          if (f !== d)
            try {
              (s ? e.setAttributeNS(s, o, f) : e.setAttribute(o, f),
                gt(e) ? ct(e) : So(t.removed));
            } catch {
              ut(o, e);
            }
        }
        yt(T.afterSanitizeAttributes, e, null);
      },
      I = function (e) {
        let t = null,
          n = mt(e);
        for (yt(T.beforeSanitizeShadowDOM, e, null); (t = n.nextNode()); )
          if (
            (yt(T.uponSanitizeShadowNode, t, null),
            bt(t),
            wt(t),
            _t(t.content) && I(t.content),
            (y ? y(t) : t.nodeType) === us.element)
          ) {
            let e = _ ? _(t) : t.shadowRoot;
            _t(e) && (Tt(e), I(e));
          }
        yt(T.afterSanitizeShadowDOM, e, null);
      },
      Tt = function (e) {
        let t = [{ node: e, shadow: null }];
        for (; t.length > 0; ) {
          let e = t.pop();
          if (e.shadow) {
            I(e.shadow);
            continue;
          }
          let n = e.node,
            r = (y ? y(n) : n.nodeType) === us.element,
            i = h ? h(n) : n.childNodes;
          if (i)
            for (let e = i.length - 1; e >= 0; --e)
              t.push({ node: i[e], shadow: null });
          if (r) {
            let e = b ? b(n) : null;
            if (typeof e == `string` && F(e) === `template`) {
              let e = n.content;
              _t(e) && t.push({ node: e, shadow: null });
            }
          }
          if (r) {
            let e = _ ? _(n) : n.shadowRoot;
            _t(e) &&
              t.push({ node: null, shadow: e }, { node: e, shadow: null });
          }
        }
      };
    return (
      (t.sanitize = function (e) {
        let n =
            arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {},
          i = null,
          a = null,
          o = null,
          s = null;
        if (
          ((Je = !e),
          Je && (e = `<!-->`),
          typeof e != `string` && !vt(e) && ((e = Bo(e)), typeof e != `string`))
        )
          throw Lo(`dirty is not a string, aborting`);
        if (!t.isSupported) return e;
        (Me || it(n), (t.removed = []));
        let c = Le && typeof e != `string` && vt(e);
        if (c) {
          let t = b ? b(e) : e.nodeName;
          if (typeof t == `string`) {
            let e = F(t);
            if (!E[e] || Se[e])
              throw Lo(
                `root node is forbidden and cannot be sanitized in-place`,
              );
          }
          if (gt(e))
            throw Lo(`root node is clobbered and cannot be sanitized in-place`);
          try {
            Tt(e);
          } catch (t) {
            throw (lt(e), t);
          }
        } else if (vt(e))
          ((i = pt(`<!---->`)),
            (a = i.ownerDocument.importNode(e, !0)),
            (a.nodeType === us.element && a.nodeName === `BODY`) ||
            a.nodeName === `HTML`
              ? (i = a)
              : i.appendChild(a),
            Tt(a));
        else {
          if (!Ne && !ke && !je && e.indexOf(`<`) === -1)
            return x && j ? ne(e) : e;
          if (((i = pt(e)), !i)) return Ne ? null : j ? S : ``;
        }
        i && k && ct(i.firstChild);
        let l = mt(c ? e : i);
        try {
          for (; (o = l.nextNode()); )
            (bt(o), wt(o), _t(o.content) && I(o.content));
        } catch (t) {
          throw (c && lt(e), t);
        }
        if (c)
          return (
            bo(t.removed, (e) => {
              e.element && ft(e.element);
            }),
            ke && ht(e),
            e
          );
        if (Ne) {
          if ((ke && ht(i), A))
            for (s = ce.call(i.ownerDocument); i.firstChild; )
              s.appendChild(i.firstChild);
          else s = i;
          return (
            (D.shadowroot || D.shadowrootmode) && (s = ue.call(r, s, !0)),
            s
          );
        }
        let u = je ? i.outerHTML : i.innerHTML;
        return (
          je &&
            E[`!doctype`] &&
            i.ownerDocument &&
            i.ownerDocument.doctype &&
            i.ownerDocument.doctype.name &&
            X(cs, i.ownerDocument.doctype.name) &&
            (u =
              `<!DOCTYPE ` +
              i.ownerDocument.doctype.name +
              `>
` +
              u),
          ke &&
            bo([de, fe, pe], (e) => {
              u = ko(u, e, ` `);
            }),
          x && j ? ne(u) : u
        );
      }),
      (t.setConfig = function () {
        (it(
          arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {},
        ),
          (Me = !0));
      }),
      (t.clearConfig = function () {
        ((tt = null), (Me = !1), (x = C), (S = ``));
      }),
      (t.isValidAttribute = function (e, t, n) {
        return (tt || it({}), xt(F(e), F(t), n));
      }),
      (t.addHook = function (e, t) {
        typeof t == `function` && Co(T[e], t);
      }),
      (t.removeHook = function (e, t) {
        if (t !== void 0) {
          let n = xo(T[e], t);
          return n === -1 ? void 0 : wo(T[e], n, 1)[0];
        }
        return So(T[e]);
      }),
      (t.removeHooks = function (e) {
        T[e] = [];
      }),
      (t.removeAllHooks = function () {
        T = ps();
      }),
      t
    );
  }
  var hs = ms(),
    gs = W(
      `<button class="floating-chat-trigger svelte-1lsysha" title="打开智能助手" aria-label="打开智能助手"><div class="trigger-ring svelte-1lsysha"><svg class="trigger-svg svelte-1lsysha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" class="svelte-1lsysha"></path><path d="M8 10h.01M12 10h.01M16 10h.01" class="svelte-1lsysha"></path></svg></div> <span class="trigger-badge svelte-1lsysha">AI</span></button>`,
    ),
    _s = W(
      `<button class="header-icon-btn svelte-1lsysha" title="返回对话"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><path d="m15 18-6-6 6-6" class="svelte-1lsysha"></path></svg></button>`,
    ),
    vs = W(
      `<button class="header-icon-btn svelte-1lsysha" title="会话列表"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><line x1="3" x2="21" y1="6" y2="6" class="svelte-1lsysha"></line><line x1="3" x2="21" y1="12" y2="12" class="svelte-1lsysha"></line><line x1="3" x2="21" y1="18" y2="18" class="svelte-1lsysha"></line></svg></button>`,
    ),
    ys = W(
      `<button class="header-icon-btn svelte-1lsysha" title="开启新对话"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><path d="M5 12h14" class="svelte-1lsysha"></path><path d="M12 5v14" class="svelte-1lsysha"></path></svg></button>`,
    ),
    bs = W(
      `<div class="widget-blocked svelte-1lsysha"><span class="blocked-lock svelte-1lsysha">🔒</span> <h4 class="svelte-1lsysha">智能助手已锁定</h4> <p class="svelte-1lsysha">您的账户尚未激活，请联系管理员激活以启用智能对话能力。</p></div>`,
    ),
    xs = W(
      `<div class="widget-loading svelte-1lsysha">载入会话列表中...</div>`,
    ),
    Ss = W(`<div class="widget-empty svelte-1lsysha">没有历史会话记录</div>`),
    Cs = W(
      `<div><div class="session-card-info svelte-1lsysha"><div class="session-card-title svelte-1lsysha"> </div> <div class="session-card-meta svelte-1lsysha"><span class="svelte-1lsysha"> </span></div></div> <button class="session-delete-btn svelte-1lsysha" title="删除会话" aria-label="删除会话">🗑️</button></div>`,
    ),
    ws = W(`<div class="sessions-grid svelte-1lsysha"></div>`),
    Ts = W(
      `<div class="sessions-pane svelte-1lsysha"><div class="sessions-header svelte-1lsysha"><button class="widget-btn primary svelte-1lsysha" style="width: 100%;">+ 开启新的对话</button></div> <div class="sessions-list-scroll svelte-1lsysha"><!></div></div>`,
    ),
    Es = W(
      `<div class="widget-loading svelte-1lsysha">正在提取聊天记录...</div>`,
    ),
    Ds = W(
      `<div class="chat-welcome svelte-1lsysha"><span class="welcome-avatar svelte-1lsysha">📚</span> <h3 class="svelte-1lsysha">Knovana AI 智能助手</h3> <p class="svelte-1lsysha">您可以问我关于知识库整理、Markdown格式优化、专题归纳的任何问题，我会竭诚为您提供分析和编写服务。</p></div>`,
    ),
    Os = W(
      `<details class="thinking-details svelte-1lsysha"><summary class="svelte-1lsysha">🧠 推理思考过程</summary> <pre class="thinking-text svelte-1lsysha"> </pre></details>`,
    ),
    ks = W(
      `<p style="white-space: pre-wrap; margin: 0;" class="svelte-1lsysha"> </p>`,
    ),
    As = W(`<div class="markdown-rich-content svelte-1lsysha"></div>`),
    js = W(
      `<div><div class="message-avatar svelte-1lsysha"> </div> <div class="message-content-wrapper svelte-1lsysha"><!> <div class="message-bubble svelte-1lsysha"><!></div></div></div>`,
    ),
    Ms = W(`<div class="messages-list svelte-1lsysha"></div>`),
    Ns = W(
      `<div class="status-indicator svelte-1lsysha"><span class="pulse-icon svelte-1lsysha">●</span> <span class="status-msg svelte-1lsysha"> </span></div>`,
    ),
    Ps = W(
      `<button class="widget-btn-small svelte-1lsysha">🔄 重新生成</button>`,
    ),
    Fs = W(
      `<div class="chat-pane svelte-1lsysha"><div class="chat-messages-container svelte-1lsysha"><!></div> <div class="composer-container svelte-1lsysha"><div class="composer-card svelte-1lsysha"><textarea class="composer-textarea svelte-1lsysha" placeholder="向 Knovana 提问..."></textarea> <div class="composer-toolbar svelte-1lsysha"><div class="toolbar-left svelte-1lsysha"><!></div> <div class="toolbar-right svelte-1lsysha"><button class="widget-send-btn svelte-1lsysha" title="发送" aria-label="发送"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><path d="m22 2-7 20-4-9-9-4Z" class="svelte-1lsysha"></path><path d="M22 2 11 13" class="svelte-1lsysha"></path></svg></button></div></div></div></div></div>`,
    ),
    Is = W(
      `<div class="widget-window svelte-1lsysha"><div class="notebook-margin-line svelte-1lsysha"></div>  <div class="resize-handle-tl svelte-1lsysha" title="缩放 (左上角)"><svg viewBox="0 0 100 100" class="resize-handle-svg svelte-1lsysha"><line x1="100" y1="0" x2="0" y2="100" stroke="#b25a38" stroke-width="15" class="svelte-1lsysha"></line></svg></div>  <div class="resize-handle-br svelte-1lsysha" title="缩放 (右下角)"><svg viewBox="0 0 100 100" class="resize-handle-svg-br svelte-1lsysha"><line x1="0" y1="100" x2="100" y2="0" stroke="#b25a38" stroke-width="15" class="svelte-1lsysha"></line></svg></div>  <div class="widget-header svelte-1lsysha"><div class="header-left svelte-1lsysha"><!> <span class="header-title svelte-1lsysha"> </span></div> <div class="header-right svelte-1lsysha"><!> <button class="header-icon-btn close svelte-1lsysha" title="最小化"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><line x1="18" x2="6" y1="6" y2="18" class="svelte-1lsysha"></line><line x1="6" x2="18" y1="6" y2="18" class="svelte-1lsysha"></line></svg></button></div></div> <div class="widget-body svelte-1lsysha"><!></div></div>`,
    ),
    Ls = W(`<div class="knovana-chat-container svelte-1lsysha"><!></div>`),
    Rs = {
      hash: `svelte-1lsysha`,
      code: `
  /* Fully scoped custom element styles for Shadow DOM */:host {
    /* Set Outfit / Lora font stacks locally in shadow root */--font-sans: "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;--font-serif: "Lora", Georgia, "Times New Roman", serif;--bg-paper: #fcfbf9;--bg-card: #f5f4ef;--bg-card-hover: #ebeae4;--text-ink: #1c1c1a;--text-muted: #5e5c54;--border-fine: #e6e4dc;--accent-ochre: #b25a38;--accent-terracotta: #a04724;--accent-sage: #4a6b5d;font-family:var(--font-sans);color:var(--text-ink);}.svelte-1lsysha {box-sizing:border-box;margin:0;padding:0;}.knovana-chat-container.svelte-1lsysha {position:relative;font-family:var(--font-sans);line-height:1.5;}

  /* Redesigned Floating Chat Trigger (Premium Paper Stamp Style) */.floating-chat-trigger.svelte-1lsysha {position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:14px; /* Squircle appearance */background:var(--bg-paper);border:1.5px solid var(--text-ink);box-shadow:0 4px 10px rgba(28, 28, 26, 0.08), 
      0 12px 28px rgba(28, 28, 26, 0.06);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:9999;transition:all 0.25s cubic-bezier(0.16, 1, 0.3, 1);outline:none;padding:3px;}.trigger-ring.svelte-1lsysha {width:100%;height:100%;border-radius:10px;border:1px dashed var(--border-fine);display:flex;align-items:center;justify-content:center;transition:border-color 0.2s ease;}.trigger-svg.svelte-1lsysha {width:22px;height:22px;color:var(--accent-ochre);transition:transform 0.25s ease, color 0.2s ease;}.floating-chat-trigger.svelte-1lsysha:hover {transform:translateY(-4px) scale(1.04);background:var(--text-ink);border-color:var(--text-ink);box-shadow:0 6px 15px rgba(28, 28, 26, 0.14), 
      0 18px 36px rgba(28, 28, 26, 0.1);}.floating-chat-trigger.svelte-1lsysha:hover .trigger-ring:where(.svelte-1lsysha) {border-color:var(--text-muted);}.floating-chat-trigger.svelte-1lsysha:hover .trigger-svg:where(.svelte-1lsysha) {transform:rotate(5deg) scale(1.05);color:var(--bg-paper);}.trigger-badge.svelte-1lsysha {position:absolute;top:-4px;right:-4px;background:var(--accent-ochre);color:#ffffff;font-size:8px;font-weight:700;padding:1px 4.5px;border-radius:6px;border:1.5px solid var(--bg-paper);font-family:var(--font-sans);letter-spacing:0.5px;}

  /* Open Floating Window (Notebook Aesthetic) */.widget-window.svelte-1lsysha {position:fixed;right:24px;bottom:24px; /* Aligned vertically with trigger bottom */z-index:9999;background:var(--bg-paper);border:1.5px solid var(--text-ink);border-radius:12px;box-shadow:0 12px 36px rgba(28, 28, 26, 0.08), 
      0 24px 72px rgba(28, 28, 26, 0.06);display:flex;flex-direction:column;overflow:hidden;min-width:340px;min-height:400px;max-width:90vw;max-height:90vh;
    animation: svelte-1lsysha-windowFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);}

  @keyframes svelte-1lsysha-windowFadeIn {
    from { opacity: 0; transform: translateY(15px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Vertical Notebook Ruler Line */.notebook-margin-line.svelte-1lsysha {position:absolute;left:20px;top:0;bottom:0;width:1px;background:#e07b6b;opacity:0.35;pointer-events:none;z-index:99;}

  /* Drag Header (Premium leather/card strip) */.widget-header.svelte-1lsysha {height:46px;background:var(--bg-card);border-bottom:1.5px solid var(--text-ink);display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 28px; /* Left padded to clear margin line */cursor:move;user-select:none;flex-shrink:0;}.header-left.svelte-1lsysha {display:flex;align-items:center;gap:8px;min-width:0;}.header-title.svelte-1lsysha {font-size:13.5px;font-weight:700;font-family:var(--font-sans);color:var(--text-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:0.3px;}.header-right.svelte-1lsysha {display:flex;align-items:center;gap:6px;}.header-icon-btn.svelte-1lsysha {background:transparent;border:none;cursor:pointer;color:var(--text-muted);width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;outline:none;}.header-icon-btn.svelte-1lsysha:hover {background:var(--bg-card-hover);color:var(--text-ink);}.header-icon-btn.close.svelte-1lsysha:hover {color:#ef4444;background:#fee2e2;}

  /* Top-left resize handle */.resize-handle-tl.svelte-1lsysha {position:absolute;top:0;left:0;width:16px;height:16px;cursor:nwse-resize;z-index:10000;background:transparent;}.resize-handle-svg.svelte-1lsysha {width:7px;height:7px;position:absolute;top:2px;left:2px;opacity:0.5;transition:opacity 0.2s ease;}.resize-handle-tl.svelte-1lsysha:hover .resize-handle-svg:where(.svelte-1lsysha) {opacity:1;}

  /* Bottom-right resize handle */.resize-handle-br.svelte-1lsysha {position:absolute;bottom:0;right:0;width:16px;height:16px;cursor:se-resize;z-index:10000;background:transparent;}.resize-handle-svg-br.svelte-1lsysha {width:7px;height:7px;position:absolute;bottom:2px;right:2px;opacity:0.5;transition:opacity 0.2s ease;}.resize-handle-br.svelte-1lsysha:hover .resize-handle-svg-br:where(.svelte-1lsysha) {opacity:1;}

  /* Main body container */.widget-body.svelte-1lsysha {flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg-paper);position:relative;}.widget-blocked.svelte-1lsysha {display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;height:100%;text-align:center;}.blocked-lock.svelte-1lsysha {font-size:44px;margin-bottom:14px;}.widget-blocked.svelte-1lsysha h4:where(.svelte-1lsysha) {font-family:var(--font-sans);font-weight:700;margin-bottom:6px;font-size:14px;}.widget-blocked.svelte-1lsysha p:where(.svelte-1lsysha) {font-size:12.5px;color:var(--text-muted);line-height:1.45;}

  /* Scroll areas */.chat-messages-container.svelte-1lsysha {flex:1;overflow-y:auto;padding:16px 16px 16px 28px; /* Left padded to clear notebook margin line */}

  /* Custom Scrollbar for messages & code */.chat-messages-container.svelte-1lsysha::-webkit-scrollbar,
  .thinking-text.svelte-1lsysha::-webkit-scrollbar,
  .sessions-list-scroll.svelte-1lsysha::-webkit-scrollbar {width:5px;height:5px;}.chat-messages-container.svelte-1lsysha::-webkit-scrollbar-track,
  .thinking-text.svelte-1lsysha::-webkit-scrollbar-track,
  .sessions-list-scroll.svelte-1lsysha::-webkit-scrollbar-track {background:transparent;}.chat-messages-container.svelte-1lsysha::-webkit-scrollbar-thumb,
  .thinking-text.svelte-1lsysha::-webkit-scrollbar-thumb,
  .sessions-list-scroll.svelte-1lsysha::-webkit-scrollbar-thumb {background:var(--bg-card-hover);border-radius:3px;}.chat-messages-container.svelte-1lsysha::-webkit-scrollbar-thumb:hover,
  .thinking-text.svelte-1lsysha::-webkit-scrollbar-thumb:hover,
  .sessions-list-scroll.svelte-1lsysha::-webkit-scrollbar-thumb:hover {background:var(--accent-ochre);}.chat-welcome.svelte-1lsysha {display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 10px;color:var(--text-muted);}.welcome-avatar.svelte-1lsysha {font-size:44px;margin-bottom:12px;}.chat-welcome.svelte-1lsysha h3:where(.svelte-1lsysha) {font-family:var(--font-sans);font-size:15px;font-weight:700;margin-bottom:6px;color:var(--text-ink);}.chat-welcome.svelte-1lsysha p:where(.svelte-1lsysha) {font-size:12px;line-height:1.5;max-width:250px;}.messages-list.svelte-1lsysha {display:flex;flex-direction:column;gap:16px;}

  /* Message balloon layout */.message-row.svelte-1lsysha {display:flex;gap:8px;align-items:flex-start;}.message-row.user.svelte-1lsysha {flex-direction:row-reverse;}.message-avatar.svelte-1lsysha {width:26px;height:26px;border-radius:50%;background:var(--bg-card);border:1px solid var(--border-fine);display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;user-select:none;}.message-content-wrapper.svelte-1lsysha {display:flex;flex-direction:column;gap:4px;max-width:78%;}.message-bubble.svelte-1lsysha {padding:9px 12px;border-radius:8px;font-size:13px;line-height:1.5;}

  /* Redesigned Paper theme bubble colors */.message-row.user.svelte-1lsysha .message-bubble:where(.svelte-1lsysha) {background:#fdfaf7;color:var(--text-ink);border:1.5px solid var(--accent-ochre);border-top-right-radius:2px;text-align:left;box-shadow:0 2px 6px rgba(178, 90, 56, 0.05);}.message-row.assistant.svelte-1lsysha .message-bubble:where(.svelte-1lsysha) {background:#ffffff;color:var(--text-ink);border:1px dashed var(--border-fine);border-top-left-radius:2px;box-shadow:0 2px 6px rgba(28, 28, 26, 0.02);}

  /* Thinking Details styles */.thinking-details.svelte-1lsysha {margin-bottom:6px;border:1px dashed var(--border-fine);border-radius:6px;background:var(--bg-card);overflow:hidden;}.thinking-details.svelte-1lsysha summary:where(.svelte-1lsysha) {padding:6px 10px;font-size:10px;font-weight:700;color:var(--accent-ochre);cursor:pointer;user-select:none;outline:none;background:var(--bg-card-hover);}.thinking-text.svelte-1lsysha {padding:10px;font-family:monospace;font-size:10.5px;color:var(--text-muted);background:var(--bg-card);max-height:100px;overflow-y:auto;white-space:pre-wrap;border-top:1px dashed var(--border-fine);margin:0;}

  /* Markdown custom styles inside Chat message bubble */.markdown-rich-content.svelte-1lsysha {font-family:var(--font-sans);}.markdown-rich-content.svelte-1lsysha p:where(.svelte-1lsysha) {margin-bottom:6px;}.markdown-rich-content.svelte-1lsysha p:where(.svelte-1lsysha):last-child {margin-bottom:0;}.markdown-rich-content.svelte-1lsysha pre:where(.svelte-1lsysha) {background:#252422;color:#f4f3ef;padding:8px 10px;border-radius:4px;overflow-x:auto;margin:6px 0;}

  /* Streamlined Composer Card Layout (Extension-style) */.composer-container.svelte-1lsysha {padding:10px 14px 14px 28px; /* Left padded to align with notebook lines */background:transparent;flex-shrink:0;z-index:100;}.composer-card.svelte-1lsysha {background:#ffffff;border:1.5px solid var(--text-ink);border-radius:12px;padding:8px 10px 6px;display:flex;flex-direction:column;gap:6px;box-shadow:0 2px 8px rgba(28, 28, 26, 0.04);transition:border-color 0.2s ease, box-shadow 0.2s ease;}.composer-card.svelte-1lsysha:focus-within {border-color:var(--accent-ochre);box-shadow:0 4px 12px rgba(28, 28, 26, 0.06),
      0 0 0 3px rgba(178, 90, 56, 0.08);}.composer-textarea.svelte-1lsysha {border:0;outline:none;resize:none;background:transparent;padding:2px 0;font-family:var(--font-sans);font-size:13px;line-height:1.45;color:var(--text-ink);min-height:24px;max-height:120px;width:100%;scrollbar-width:thin;}.composer-textarea.svelte-1lsysha::placeholder {color:var(--text-muted);}.composer-toolbar.svelte-1lsysha {display:flex;align-items:center;justify-content:space-between;border-top:1px dashed var(--border-fine);padding-top:6px;}.toolbar-left.svelte-1lsysha {display:flex;align-items:center;gap:8px;min-width:0;}.toolbar-right.svelte-1lsysha {display:flex;align-items:center;}.widget-send-btn.svelte-1lsysha {width:26px;height:26px;border-radius:50%;background:var(--text-ink);border:none;color:var(--bg-paper);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;outline:none;flex-shrink:0;}.widget-send-btn.svelte-1lsysha:hover:not(:disabled) {background:var(--accent-ochre);transform:scale(1.05);}.widget-send-btn.svelte-1lsysha:disabled {opacity:0.35;cursor:not-allowed;transform:none;}

  /* Status message under composer toolbar */.status-indicator.svelte-1lsysha {display:flex;align-items:center;gap:4px;color:var(--text-muted);font-size:10px;}.pulse-icon.svelte-1lsysha {color:var(--accent-ochre);font-size:8px;
    animation: svelte-1lsysha-statusPulse 1.2s infinite;}

  @keyframes svelte-1lsysha-statusPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }.status-msg.svelte-1lsysha {font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}.widget-btn-small.svelte-1lsysha {background:transparent;border:1px solid var(--border-fine);color:var(--text-muted);padding:2px 6px;font-size:10px;border-radius:4px;font-family:var(--font-sans);cursor:pointer;transition:all 0.15s ease;outline:none;}.widget-btn-small.svelte-1lsysha:hover {background:var(--bg-card-hover);color:var(--text-ink);border-color:var(--text-ink);}

  /* General Button styling */.widget-btn.svelte-1lsysha {padding:6px 12px;background:var(--bg-card);border:1px solid var(--text-ink);color:var(--text-ink);border-radius:4px;font-family:var(--font-sans);font-size:12px;font-weight:500;cursor:pointer;transition:all 0.2s ease;outline:none;}.widget-btn.svelte-1lsysha:hover {background:var(--text-ink);color:var(--bg-paper);}.widget-btn.primary.svelte-1lsysha {background:var(--accent-ochre);border-color:var(--accent-ochre);color:#ffffff;}.widget-btn.primary.svelte-1lsysha:hover {background:var(--accent-terracotta);border-color:var(--accent-terracotta);}

  /* Sessions pane */.sessions-pane.svelte-1lsysha {flex:1;display:flex;flex-direction:column;overflow:hidden;}.sessions-header.svelte-1lsysha {padding:10px 14px 10px 28px;border-bottom:1px solid var(--border-fine);background:var(--bg-card);}.sessions-list-scroll.svelte-1lsysha {flex:1;overflow-y:auto;padding:12px 12px 12px 28px;}.sessions-grid.svelte-1lsysha {display:flex;flex-direction:column;gap:8px;}.session-item-card.svelte-1lsysha {display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg-paper);border:1px solid var(--border-fine);border-radius:6px;cursor:pointer;transition:all 0.2s ease;}.session-item-card.svelte-1lsysha:hover {border-color:var(--text-ink);background:var(--bg-card);}.session-item-card.selected.svelte-1lsysha {border-color:var(--accent-ochre);background:rgba(178, 90, 56, 0.04);}.session-card-info.svelte-1lsysha {display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}.session-card-title.svelte-1lsysha {font-size:12.5px;font-weight:700;color:var(--text-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left;}.session-card-meta.svelte-1lsysha {font-size:10.5px;color:var(--text-muted);text-align:left;}.session-delete-btn.svelte-1lsysha {width:22px;height:22px;border-radius:4px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;opacity:0.4;transition:all 0.15s ease;outline:none;}.session-item-card.svelte-1lsysha:hover .session-delete-btn:where(.svelte-1lsysha) {opacity:0.7;}.session-delete-btn.svelte-1lsysha:hover {background:#fee2e2;opacity:1 !important;}.widget-loading.svelte-1lsysha, .widget-empty.svelte-1lsysha {padding:30px;font-size:11.5px;color:var(--text-muted);text-align:center;}.chat-pane.svelte-1lsysha {flex:1;display:flex;flex-direction:column;overflow:hidden;}`,
    };
  function zs(e, t) {
    (We(t, !0), $r(e, Rs));
    let n = bi(t, `apiUrl`, 7, `http://localhost:8000`),
      r = bi(t, `token`, 7, ``),
      i = bi(t, `isBlocked`, 7, !1),
      a = L(!0),
      o = L(!1),
      s = L(420),
      c = L(600),
      l = L(null),
      u = L(null),
      d = L($t([])),
      f = L(null),
      p = L($t([])),
      m = L(`智能会话`),
      h = L(``),
      g = L(!1),
      _ = L(``),
      v = L(!1),
      y = L(!1),
      b = L(null),
      x = L(null);
    async function S() {
      U(b) && (await mr(), (U(b).scrollTop = U(b).scrollHeight));
    }
    async function C(e, t, i) {
      let a = { "Content-Type": `application/json` };
      r() && (a.Authorization = `Bearer ${r()}`);
      let o = await fetch(`${n()}${t}`, {
        method: e,
        headers: a,
        body: i ? JSON.stringify(i) : void 0,
      });
      if (!o.ok) {
        let e = await o.text();
        throw Error(e || `Request failed with status ${o.status}`);
      }
      return o.json();
    }
    async function ee(e, t) {
      if (!e.body) throw Error(`No response body`);
      let n = e.body.getReader(),
        r = new TextDecoder(),
        i = ``;
      try {
        for (;;) {
          let { done: e, value: a } = await n.read();
          if (e) break;
          i += r.decode(a, { stream: !0 });
          let o = i.split(/\r?\n/);
          i = o.pop() ?? ``;
          for (let e of o) {
            let n = e.trim();
            if (!n.startsWith(`data:`)) continue;
            let r = n.slice(5).trimStart();
            if (!(!r || r === `[DONE]`))
              try {
                t(JSON.parse(r));
              } catch {}
          }
        }
      } finally {
        n.releaseLock();
      }
    }
    async function w() {
      if (!i()) {
        R(y, !0);
        try {
          (R(
            d,
            (await C(`GET`, `/api/v1/chat/sessions?page=1&per_page=50`))
              .sessions || [],
            !0,
          ),
            !U(f) && U(d).length > 0 && ne(U(d)[0].id));
        } catch (e) {
          console.error(`Failed to load sessions`, e);
        } finally {
          R(y, !1);
        }
      }
    }
    async function te() {
      if (!i()) {
        (R(g, !1), R(_, ``));
        try {
          let e = await C(`POST`, `/api/v1/chat/sessions`, { title: `新对话` });
          (R(f, e.id, !0),
            R(m, e.title || `新对话`, !0),
            R(p, [], !0),
            R(o, !1),
            await w());
        } catch (e) {
          console.error(`Failed to create session`, e);
        }
      }
    }
    async function ne(e) {
      (R(f, e, !0), R(o, !1), R(v, !0), R(p, [], !0), R(_, ``));
      try {
        let t = await C(`GET`, `/api/v1/chat/sessions/${e}`);
        (R(m, t.title || `智能会话`, !0), R(p, t.messages || [], !0), S());
      } catch (e) {
        console.error(`Failed to load session details`, e);
      } finally {
        R(v, !1);
      }
    }
    async function re(e, t) {
      if ((t.stopPropagation(), confirm(`确定要删除该对话会话吗？`)))
        try {
          (await C(`DELETE`, `/api/v1/chat/sessions/${e}`),
            U(f) === e && (R(f, null), R(p, [], !0), R(m, `智能会话`)),
            await w());
        } catch (e) {
          console.error(`Failed to delete session`, e);
        }
    }
    async function ie() {
      if (!U(h).trim() || U(g) || i()) return;
      let e = U(h).trim();
      R(h, ``);
      let t = `msg_user_${Date.now()}`;
      (R(
        p,
        [
          ...U(p),
          {
            id: t,
            role: `user`,
            content: e,
            created_at: new Date().toISOString(),
          },
        ],
        !0,
      ),
        S(),
        R(g, !0),
        R(_, `正在唤醒智能助手...`));
      let a = ``,
        o = [];
      try {
        let t = { message: e };
        U(f) && (t.session_id = U(f));
        let i = r() ? `Bearer ${r()}` : ``,
          l = await fetch(`${n()}/api/v1/chat`, {
            method: `POST`,
            headers: { "Content-Type": `application/json`, Authorization: i },
            body: JSON.stringify(t),
          });
        if (!l.ok) throw Error(`Server returned HTTP ${l.status}`);
        await ee(l, (e) => {
          if (e.type === `message_start`)
            ((a = e.message?.id),
              R(
                p,
                [
                  ...U(p),
                  {
                    id: a,
                    role: `assistant`,
                    content: ``,
                    created_at: new Date().toISOString(),
                    thinking: ``,
                  },
                ],
                !0,
              ));
          else if (e.type === `session_created`)
            U(f) || (R(f, e.session_id, !0), w());
          else if (e.type === `status`) R(_, e.text || ``, !0);
          else if (e.type === `content_block_start`) {
            let t = e.index;
            o[t] = e.content_block;
          } else if (e.type === `content_block_delta`) {
            let t = e.index,
              n = e.delta;
            n.type === `text_delta` && n.text
              ? (o[t] || (o[t] = { type: `text`, text: `` }),
                (o[t].text += n.text),
                s())
              : n.type === `thinking_delta` &&
                n.text &&
                (o[t] || (o[t] = { type: `thinking`, text: `` }),
                (o[t].text += n.text),
                c());
          } else if (e.type === `content_block_stop`) {
            let t = e.index;
            ((o[t] = e.content_block), s(), c());
          } else
            e.type === `message_end`
              ? R(_, ``)
              : e.type === `error` &&
                R(_, `Error: ${e.error?.message || `流式输出故障`}`);
        });
      } catch (e) {
        (console.error(`Streaming error`, e),
          R(_, `连接助手失败: ${e.message || `未知网络错误`}`));
      } finally {
        (R(g, !1), await w());
      }
      function s() {
        let e = o
            .filter((e) => e && e.type === `text` && e.text)
            .map((e) => e.text)
            .join(``),
          t = U(p).findIndex((e) => e.id === a);
        t !== -1 && ((U(p)[t].content = e), R(p, [...U(p)], !0), S());
      }
      function c() {
        let e = o
            .filter((e) => e && e.type === `thinking` && e.text)
            .map((e) => e.text)
            .join(``),
          t = U(p).findIndex((e) => e.id === a);
        t !== -1 && ((U(p)[t].thinking = e), R(p, [...U(p)], !0), S());
      }
    }
    async function ae() {
      if (!U(f) || U(g) || i()) return;
      (R(g, !0), R(_, `正在重新思考...`));
      let e = U(p)[U(p).length - 1];
      e && e.role === `assistant` && R(p, U(p).slice(0, -1), !0);
      let t = ``,
        a = [];
      try {
        let e = r() ? `Bearer ${r()}` : ``,
          i = await fetch(`${n()}/api/v1/chat/regenerate`, {
            method: `POST`,
            headers: { "Content-Type": `application/json`, Authorization: e },
            body: JSON.stringify({ session_id: U(f) }),
          });
        if (!i.ok) throw Error(`Server returned HTTP ${i.status}`);
        await ee(i, (e) => {
          if (e.type === `message_start`)
            ((t = e.message?.id),
              R(
                p,
                [
                  ...U(p),
                  {
                    id: t,
                    role: `assistant`,
                    content: ``,
                    created_at: new Date().toISOString(),
                    thinking: ``,
                  },
                ],
                !0,
              ));
          else if (e.type === `status`) R(_, e.text || ``, !0);
          else if (e.type === `content_block_start`) {
            let t = e.index;
            a[t] = e.content_block;
          } else if (e.type === `content_block_delta`) {
            let t = e.index,
              n = e.delta;
            n.type === `text_delta` && n.text
              ? (a[t] || (a[t] = { type: `text`, text: `` }),
                (a[t].text += n.text),
                o())
              : n.type === `thinking_delta` &&
                n.text &&
                (a[t] || (a[t] = { type: `thinking`, text: `` }),
                (a[t].text += n.text),
                s());
          } else if (e.type === `content_block_stop`) {
            let t = e.index;
            ((a[t] = e.content_block), o(), s());
          } else
            e.type === `message_end`
              ? R(_, ``)
              : e.type === `error` &&
                R(_, `Error: ${e.error?.message || `流式输出故障`}`);
        });
      } catch (e) {
        (console.error(`Regeneration error`, e),
          R(_, `重新生成回答失败: ${e.message || `未知网络错误`}`));
      } finally {
        R(g, !1);
      }
      function o() {
        let e = a
            .filter((e) => e && e.type === `text` && e.text)
            .map((e) => e.text)
            .join(``),
          n = U(p).findIndex((e) => e.id === t);
        n !== -1 && ((U(p)[n].content = e), R(p, [...U(p)], !0), S());
      }
      function s() {
        let e = a
            .filter((e) => e && e.type === `thinking` && e.text)
            .map((e) => e.text)
            .join(``),
          n = U(p).findIndex((e) => e.id === t);
        n !== -1 && ((U(p)[n].thinking = e), R(p, [...U(p)], !0), S());
      }
    }
    function oe(e) {
      if (U(a)) return;
      let t = e.target;
      if (
        t.closest(`button`) ||
        t.closest(`input`) ||
        t.closest(`textarea`) ||
        t.closest(`.resize-handle-tl`) ||
        t.closest(`.resize-handle-br`) ||
        (e.preventDefault(), !U(x))
      )
        return;
      let n = U(x).getBoundingClientRect();
      (U(l) === null || U(u) === null) && (R(l, n.left, !0), R(u, n.top, !0));
      let r = e.clientX,
        i = e.clientY,
        o = U(l),
        d = U(u);
      function f(e) {
        let t = e.clientX - r,
          n = e.clientY - i;
        (R(l, Math.max(0, Math.min(window.innerWidth - U(s), o + t)), !0),
          R(u, Math.max(0, Math.min(window.innerHeight - U(c), d + n)), !0));
      }
      function p() {
        (window.removeEventListener(`mousemove`, f),
          window.removeEventListener(`mouseup`, p));
      }
      (window.addEventListener(`mousemove`, f),
        window.addEventListener(`mouseup`, p));
    }
    function se(e) {
      if ((e.preventDefault(), e.stopPropagation(), !U(x))) return;
      let t = U(x).getBoundingClientRect(),
        n = U(l) === null || U(u) === null,
        r = e.clientX,
        i = e.clientY,
        a = U(s),
        o = U(c),
        d = n ? t.left : U(l),
        f = n ? t.top : U(u);
      function p(e) {
        let t = e.clientX - r,
          p = e.clientY - i,
          m = Math.max(340, Math.min(800, a - t)),
          h = Math.max(400, Math.min(900, o - p)),
          g = a - m,
          _ = o - h;
        (R(s, m, !0),
          R(c, h, !0),
          n
            ? (R(l, window.innerWidth - m - 24),
              R(u, window.innerHeight - h - 24))
            : (R(l, d + g), R(u, f + _)));
      }
      function m() {
        (window.removeEventListener(`mousemove`, p),
          window.removeEventListener(`mouseup`, m));
      }
      (window.addEventListener(`mousemove`, p),
        window.addEventListener(`mouseup`, m));
    }
    function ce(e) {
      if ((e.preventDefault(), e.stopPropagation(), !U(x))) return;
      let t = U(x).getBoundingClientRect();
      (U(l) === null || U(u) === null) && (R(l, t.left, !0), R(u, t.top, !0));
      let n = e.clientX,
        r = e.clientY,
        i = U(s),
        a = U(c);
      function o(e) {
        let t = e.clientX - n,
          o = e.clientY - r;
        (R(s, Math.max(340, Math.min(800, i + t)), !0),
          R(c, Math.max(400, Math.min(900, a + o)), !0));
      }
      function d() {
        (window.removeEventListener(`mousemove`, o),
          window.removeEventListener(`mouseup`, d));
      }
      (window.addEventListener(`mousemove`, o),
        window.addEventListener(`mouseup`, d));
    }
    function le(e) {
      if (!e) return ``;
      try {
        let t = J.parse(e);
        return hs.sanitize(t);
      } catch {
        return e;
      }
    }
    function ue() {
      return U(p).length === 0
        ? !1
        : U(p)[U(p).length - 1].role === `assistant`;
    }
    function T() {
      (R(a, !U(a)), !U(a) && U(d).length === 0 && w(), S());
    }
    zr(() => {
      !i() && r() && w();
    });
    var de = {
        get apiUrl() {
          return n();
        },
        set apiUrl(e = `http://localhost:8000`) {
          (n(e), Ft());
        },
        get token() {
          return r();
        },
        set token(e = ``) {
          (r(e), Ft());
        },
        get isBlocked() {
          return i();
        },
        set isBlocked(e = !1) {
          (i(e), Ft());
        },
      },
      fe = Ls(),
      pe = z(fe),
      me = (e) => {
        var t = gs();
        (xr(`click`, t, T), G(e, t));
      },
      he = (e) => {
        var t = Is(),
          n = B(z(t), 2),
          r = B(n, 2),
          a = B(r, 2),
          S = z(a),
          C = z(S),
          ee = (e) => {
            var t = _s();
            (xr(`click`, t, () => R(o, !1)), G(e, t));
          },
          de = (e) => {
            var t = vs();
            (xr(`click`, t, () => {
              (R(o, !0), w());
            }),
              G(e, t));
          };
        Vr(C, (e) => {
          U(o) ? e(ee) : e(de, -1);
        });
        var fe = B(C, 2),
          pe = z(fe, !0);
        (M(fe), M(S));
        var me = B(S, 2),
          he = z(me),
          ge = (e) => {
            var t = ys();
            (xr(`click`, t, te), G(e, t));
          };
        Vr(he, (e) => {
          U(o) || e(ge);
        });
        var _e = B(he, 2);
        (M(me), M(a));
        var ve = B(a, 2),
          ye = z(ve),
          E = (e) => {
            G(e, bs());
          },
          be = (e) => {
            var t = Ts(),
              n = z(t),
              r = z(n);
            M(n);
            var i = B(n, 2),
              a = z(i),
              o = (e) => {
                G(e, xs());
              },
              s = (e) => {
                G(e, Ss());
              },
              c = (e) => {
                var t = ws();
                (Kr(
                  t,
                  21,
                  () => U(d),
                  Hr,
                  (e, t) => {
                    var n = Cs();
                    let r;
                    var i = z(n),
                      a = z(i),
                      o = z(a, !0);
                    M(a);
                    var s = B(a, 2),
                      c = z(s),
                      l = z(c);
                    (M(c), M(s), M(i));
                    var u = B(i, 2);
                    (M(n),
                      An(() => {
                        ((r = ai(
                          n,
                          1,
                          `session-item-card svelte-1lsysha`,
                          null,
                          r,
                          { selected: U(f) === U(t).id },
                        )),
                          jr(o, U(t).title || `无标题会话`),
                          jr(
                            l,
                            `💬 ${(U(t).message_count || 0) ?? ``} 条消息`,
                          ));
                      }),
                      xr(`click`, n, () => ne(U(t).id)),
                      xr(`click`, u, (e) => re(U(t).id, e)),
                      G(e, n));
                  },
                ),
                  M(t),
                  G(e, t));
              };
            (Vr(a, (e) => {
              U(y) ? e(o) : U(d).length === 0 ? e(s, 1) : e(c, -1);
            }),
              M(i),
              M(t),
              xr(`click`, r, te),
              G(e, t));
          },
          D = (e) => {
            var t = Fs(),
              n = z(t),
              r = z(n),
              i = (e) => {
                G(e, Es());
              },
              a = (e) => {
                G(e, Ds());
              },
              o = (e) => {
                var t = Ms();
                (Kr(
                  t,
                  21,
                  () => U(p),
                  Hr,
                  (e, t) => {
                    var n = js(),
                      r = z(n),
                      i = z(r, !0);
                    M(r);
                    var a = B(r, 2),
                      o = z(a),
                      s = (e) => {
                        var n = Os(),
                          r = B(z(n), 2),
                          i = z(r, !0);
                        (M(r),
                          M(n),
                          An(() => {
                            ((n.open =
                              U(g) && U(p)[U(p).length - 1].id === U(t).id),
                              jr(i, U(t).thinking));
                          }),
                          G(e, n));
                      };
                    Vr(o, (e) => {
                      U(t).role === `assistant` && U(t).thinking && e(s);
                    });
                    var c = B(o, 2),
                      l = z(c),
                      u = (e) => {
                        var n = ks(),
                          r = z(n, !0);
                        (M(n), An(() => jr(r, U(t).content)), G(e, n));
                      },
                      d = (e) => {
                        var n = As();
                        (Qr(n, () => le(U(t).content), !0), M(n), G(e, n));
                      };
                    (Vr(l, (e) => {
                      U(t).role === `user` ? e(u) : e(d, -1);
                    }),
                      M(c),
                      M(a),
                      M(n),
                      An(() => {
                        (ai(
                          n,
                          1,
                          `message-row ${U(t).role ?? ``}`,
                          `svelte-1lsysha`,
                        ),
                          jr(i, U(t).role === `user` ? `👤` : `🤖`));
                      }),
                      G(e, n));
                  },
                ),
                  M(t),
                  G(e, t));
              };
            (Vr(r, (e) => {
              U(v) ? e(i) : U(p).length === 0 ? e(a, 1) : e(o, -1);
            }),
              M(n),
              yi(
                n,
                (e) => R(b, e),
                () => U(b),
              ));
            var s = B(n, 2),
              c = z(s),
              l = z(c);
            pn(l);
            var u = B(l, 2),
              d = z(u),
              f = z(d),
              m = (e) => {
                var t = Ns(),
                  n = B(z(t), 2),
                  r = z(n, !0);
                (M(n), M(t), An(() => jr(r, U(_))), G(e, t));
              },
              y = (e) => {
                var t = Ps();
                (xr(`click`, t, ae), G(e, t));
              },
              x = gt(() => ue() && !U(g));
            (Vr(f, (e) => {
              U(_) ? e(m) : U(x) && e(y, 1);
            }),
              M(d));
            var S = B(d, 2),
              C = z(S);
            (M(S),
              M(u),
              M(c),
              M(s),
              M(t),
              An(
                (e) => {
                  ((l.disabled = U(g)), (C.disabled = e));
                },
                [() => U(g) || !U(h).trim()],
              ),
              xr(`keydown`, l, (e) => {
                e.key === `Enter` && !e.shiftKey && (e.preventDefault(), ie());
              }),
              hi(
                l,
                () => U(h),
                (e) => R(h, e),
              ),
              xr(`click`, C, ie),
              G(e, t));
          };
        (Vr(ye, (e) => {
          i() ? e(E) : U(o) ? e(be, 1) : e(D, -1);
        }),
          M(ve),
          M(t),
          yi(
            t,
            (e) => R(x, e),
            () => U(x),
          ),
          An(() => {
            (si(
              t,
              `width: ${U(s) ?? ``}px; height: ${U(c) ?? ``}px; left: ${U(l) === null ? `auto` : U(l) + `px`}; top: ${U(u) === null ? `auto` : U(u) + `px`};`,
            ),
              di(fe, `title`, U(o) ? `会话列表` : U(m)),
              jr(pe, U(o) ? `历史会话` : U(m)));
          }),
          xr(`mousedown`, n, se),
          xr(`mousedown`, r, ce),
          xr(`mousedown`, a, oe),
          xr(`click`, _e, T),
          G(e, t));
      };
    return (
      Vr(pe, (e) => {
        U(a) ? e(me) : e(he, -1);
      }),
      M(fe),
      G(e, fe),
      Ge(de)
    );
  }
  return (
    Sr([`click`, `mousedown`, `keydown`]),
    customElements.define(
      `knovana-chat-widget`,
      Ei(zs, { apiUrl: {}, token: {}, isBlocked: {} }, [], [], {
        mode: `open`,
      }),
    ),
    (e.ChatWidget = zs),
    e
  );
})({});
