(function () {
  let e = document.createElement(`link`).relList;
  if (e && e.supports && e.supports(`modulepreload`)) return;
  for (let e of document.querySelectorAll(`link[rel="modulepreload"]`)) n(e);
  new MutationObserver((e) => {
    for (let t of e)
      if (t.type === `childList`)
        for (let e of t.addedNodes)
          e.tagName === `LINK` && e.rel === `modulepreload` && n(e);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(e) {
    let t = {};
    return (
      e.integrity && (t.integrity = e.integrity),
      e.referrerPolicy && (t.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === `use-credentials`
        ? (t.credentials = `include`)
        : e.crossOrigin === `anonymous`
          ? (t.credentials = `omit`)
          : (t.credentials = `same-origin`),
      t
    );
  }
  function n(e) {
    if (e.ep) return;
    e.ep = !0;
    let n = t(e);
    fetch(e.href, n);
  }
})();
var e = Array.isArray,
  t = Array.prototype.indexOf,
  n = Array.prototype.includes,
  r = Array.from,
  i = Object.keys,
  a = Object.defineProperty,
  o = Object.getOwnPropertyDescriptor,
  s = Object.getOwnPropertyDescriptors,
  c = Object.prototype,
  l = Array.prototype,
  u = Object.getPrototypeOf,
  d = Object.isExtensible,
  f = () => {};
function p(e) {
  for (var t = 0; t < e.length; t++) e[t]();
}
function m() {
  var e, t;
  return {
    promise: new Promise((n, r) => {
      ((e = n), (t = r));
    }),
    resolve: e,
    reject: t,
  };
}
var h = 1024,
  g = 2048,
  _ = 4096,
  v = 8192,
  y = 16384,
  b = 32768,
  x = 1 << 25,
  S = 65536,
  C = 1 << 19,
  w = 1 << 20,
  T = 1 << 25,
  ee = 65536,
  E = 1 << 21,
  te = 1 << 22,
  D = 1 << 23,
  ne = Symbol(`$state`),
  re = Symbol(`legacy props`),
  ie = Symbol(``),
  ae = Symbol(`attributes`),
  oe = Symbol(`class`),
  se = Symbol(`style`),
  O = Symbol(`text`),
  ce = Symbol(`form reset`),
  le = new (class extends Error {
    name = `StaleReactionError`;
    message =
      "The reaction that called `getAbortSignal()` was re-run or destroyed";
  })(),
  ue =
    !!globalThis.document?.contentType &&
    globalThis.document.contentType.includes(`xml`);
function de(e) {
  throw Error(`https://svelte.dev/e/lifecycle_outside_component`);
}
function fe() {
  throw Error(`https://svelte.dev/e/async_derived_orphan`);
}
function pe(e, t, n) {
  throw Error(`https://svelte.dev/e/each_key_duplicate`);
}
function me(e) {
  throw Error(`https://svelte.dev/e/effect_in_teardown`);
}
function he() {
  throw Error(`https://svelte.dev/e/effect_in_unowned_derived`);
}
function ge(e) {
  throw Error(`https://svelte.dev/e/effect_orphan`);
}
function _e() {
  throw Error(`https://svelte.dev/e/effect_update_depth_exceeded`);
}
function ve() {
  throw Error(`https://svelte.dev/e/hydration_failed`);
}
function k(e) {
  throw Error(`https://svelte.dev/e/props_invalid_value`);
}
function ye() {
  throw Error(`https://svelte.dev/e/state_descriptors_fixed`);
}
function be() {
  throw Error(`https://svelte.dev/e/state_prototype_fixed`);
}
function xe() {
  throw Error(`https://svelte.dev/e/state_unsafe_mutation`);
}
function Se() {
  throw Error(`https://svelte.dev/e/svelte_boundary_reset_onerror`);
}
var Ce = {},
  we = Symbol(`uninitialized`),
  Te = `http://www.w3.org/1999/xhtml`,
  Ee = `http://www.w3.org/2000/svg`,
  De = `http://www.w3.org/1998/Math/MathML`;
function Oe() {
  console.warn(`https://svelte.dev/e/derived_inert`);
}
function ke(e) {
  console.warn(`https://svelte.dev/e/hydration_mismatch`);
}
function Ae() {
  console.warn(`https://svelte.dev/e/select_multiple_invalid_value`);
}
function je() {
  console.warn(`https://svelte.dev/e/svelte_boundary_reset_noop`);
}
var A = !1;
function Me(e) {
  A = e;
}
var j;
function Ne(e) {
  if (e === null) throw (ke(), Ce);
  return (j = e);
}
function Pe() {
  return Ne(un(j));
}
function M(e) {
  if (A) {
    if (un(j) !== null) throw (ke(), Ce);
    j = e;
  }
}
function Fe(e = 1) {
  if (A) {
    for (var t = e, n = j; t--; ) n = un(n);
    j = n;
  }
}
function Ie(e = !0) {
  for (var t = 0, n = j; ; ) {
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
    var i = un(n);
    (e && n.remove(), (n = i));
  }
}
function Le(e) {
  if (!e || e.nodeType !== 8) throw (ke(), Ce);
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
    r: U,
    l: He && !t ? { s: null, u: null, $: [] } : null,
  };
}
function Ge(e) {
  var t = N,
    n = t.e;
  if (n !== null) {
    t.e = null;
    for (var r of n) Dn(r);
  }
  return (e !== void 0 && (t.x = e), (t.i = !0), (N = t.p), e ?? {});
}
function Ke() {
  return !He || (N !== null && N.l === null);
}
var qe = [];
function Je() {
  var e = qe;
  ((qe = []), p(e));
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
  var t = U;
  if (t === null) return ((H.f |= D), e);
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
var $e = ~(g | _ | h);
function P(e, t) {
  e.f = (e.f & $e) | t;
}
function et(e) {
  e.f & 512 || e.deps === null ? P(e, h) : P(e, _);
}
function tt(e) {
  if (e !== null)
    for (let t of e) !(t.f & 2) || !(t.f & 65536) || ((t.f ^= ee), tt(t.deps));
}
function nt(e, t, n) {
  (e.f & 2048 ? t.add(e) : e.f & 4096 && n.add(e), tt(e.deps), P(e, h));
}
var rt = !1,
  it = !1;
function at(e) {
  var t = it;
  try {
    return ((it = !1), [e(), it]);
  } finally {
    it = t;
  }
}
function ot(e) {
  let t = 0,
    n = qt(0),
    r;
  return () => {
    wn() &&
      (W(n),
      Mn(
        () => (
          t === 0 && (r = yr(() => e(() => Zt(n)))),
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
var st = S | C;
function ct(e, t, n, r) {
  new lt(e, t, n, r);
}
var lt = class {
  parent;
  is_pending = !1;
  transform_error;
  #e;
  #t = A ? j : null;
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
  #h = ot(
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
        var t = U;
        ((t.b = this), (t.f |= 128), n(e));
      }),
      (this.parent = U.b),
      (this.transform_error = r ?? this.parent?.transform_error ?? ((e) => e)),
      (this.#i = Nn(() => {
        if (A) {
          let e = this.#t;
          Pe();
          let t = e.data === `[!`;
          if (e.data.startsWith(`[?`)) {
            let t = JSON.parse(e.data.slice(2));
            this.#_(t);
          } else t ? this.#v() : this.#g();
        } else this.#y();
      }, st)),
      A && (this.#e = j));
  }
  #g() {
    try {
      this.#a = Pn(() => this.#r(this.#e));
    } catch (e) {
      this.error(e);
    }
  }
  #_(e) {
    let t = this.#n.failed;
    t &&
      (this.#s = Pn(() => {
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
      (this.#o = Pn(() => e(this.#e))),
      Ye(() => {
        var e = (this.#c = document.createDocumentFragment()),
          t = cn();
        (e.append(t),
          (this.#a = this.#x(() => Pn(() => this.#r(t)))),
          this.#u === 0 &&
            (this.#e.before(e),
            (this.#c = null),
            Vn(this.#o, () => {
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
        (this.#a = Pn(() => {
          this.#r(this.#e);
        })),
        this.#u > 0)
      ) {
        var e = (this.#c = document.createDocumentFragment());
        Gn(this.#a, e);
        let t = this.#n.pending;
        this.#o = Pn(() => t(this.#e));
      } else this.#b(I);
    } catch (e) {
      this.error(e);
    }
  }
  #b(e) {
    ((this.is_pending = !1), e.transfer_effects(this.#f, this.#p));
  }
  defer_effect(e) {
    nt(e, this.#f, this.#p);
  }
  is_rendered() {
    return !this.is_pending && (!this.parent || this.parent.is_rendered());
  }
  has_pending_snippet() {
    return !!this.#n.pending;
  }
  #x(e) {
    var t = U,
      n = H,
      r = N;
    (Qn(this.#i), Zn(this.#i), Ue(this.#i.ctx));
    try {
      return (Pt.ensure(), e());
    } catch (e) {
      return (Ze(e), null);
    } finally {
      (Qn(t), Zn(n), Ue(r));
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
          Vn(this.#o, () => {
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
    return (this.#h(), W(this.#m));
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
    ((this.#a &&= (Rn(this.#a), null)),
      (this.#o &&= (Rn(this.#o), null)),
      (this.#s &&= (Rn(this.#s), null)),
      A && (Ne(this.#t), Fe(), Ne(Ie())));
    var t = this.#n.onerror;
    let n = this.#n.failed;
    var r = !1,
      i = !1;
    let a = () => {
        if (r) {
          je();
          return;
        }
        ((r = !0),
          i && Se(),
          this.#s !== null &&
            Vn(this.#s, () => {
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
              return Pn(() => {
                var t = U;
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
function ut(e, t, n, r) {
  let i = Ke() ? mt : _t;
  var a = e.filter((e) => !e.settled),
    o = t.map(i);
  if (n.length === 0 && a.length === 0) {
    r(o);
    return;
  }
  var s = U,
    c = dt(),
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
      ft();
    }
  }
  var d = pt();
  if (n.length === 0) {
    l.then(() => u([])).finally(d);
    return;
  }
  function f() {
    Promise.all(n.map((e) => gt(e)))
      .then(u)
      .catch((e) => Qe(e, s))
      .finally(d);
  }
  l
    ? l.then(() => {
        (c(), f(), ft());
      })
    : f();
}
function dt() {
  var e = U,
    t = H,
    n = N,
    r = I;
  return function (i = !0) {
    (Qn(e), Zn(t), Ue(n), i && !(e.f & 16384) && (r?.activate(), r?.apply()));
  };
}
function ft(e = !0) {
  (Qn(null), Zn(null), Ue(null), e && I?.deactivate());
}
function pt() {
  var e = U,
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
function mt(e) {
  var t = 2 | g;
  return (
    U !== null && (U.f |= C),
    {
      ctx: N,
      deps: null,
      effects: null,
      equals: Re,
      f: t,
      fn: e,
      reactions: null,
      rv: 0,
      v: we,
      wv: 0,
      parent: U,
      ac: null,
    }
  );
}
var ht = Symbol(`obsolete`);
function gt(e, t, n) {
  let r = U;
  r === null && fe();
  var i = void 0,
    a = qt(we),
    o = !H,
    s = new Set();
  return (
    jn(() => {
      var t = U,
        n = m();
      i = n.promise;
      try {
        Promise.resolve(e())
          .then(n.resolve, (e) => {
            e !== le && n.reject(e);
          })
          .finally(ft);
      } catch (e) {
        (n.reject(e), ft());
      }
      var c = I;
      if (o) {
        if (t.f & 32768) var l = pt();
        if (r.b?.is_rendered()) c.async_deriveds.get(t)?.reject(ht);
        else for (let e of s.values()) e.reject(ht);
        (s.add(n), c.async_deriveds.set(t, n));
      }
      let u = (e, t = void 0) => {
        (l?.(),
          s.delete(n),
          t !== ht &&
            (c.activate(),
            t
              ? ((a.f |= D), Yt(a, t))
              : (a.f & 8388608 && (a.f ^= D), Yt(a, e)),
            c.deactivate()));
      };
      n.promise.then(u, (e) => u(null, e || `unknown`));
    }),
    Tn(() => {
      for (let e of s) e.reject(ht);
    }),
    new Promise((e) => {
      function t(n) {
        function r() {
          n === i ? e(a) : t(i);
        }
        n.then(r, r);
      }
      t(i);
    })
  );
}
function F(e) {
  let t = mt(e);
  return (Ve || er(t), t);
}
function _t(e) {
  let t = mt(e);
  return ((t.equals = Be), t);
}
function vt(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1) Rn(t[n]);
  }
}
function yt(e) {
  var t,
    n = U,
    r = e.parent;
  if (!Jn && r !== null && e.v !== we && r.f & 24576) return (Oe(), e.v);
  Qn(r);
  try {
    ((e.f &= ~ee), vt(e), (t = fr(e)));
  } finally {
    Qn(n);
  }
  return t;
}
function bt(e) {
  var t = yt(e);
  if (
    !e.equals(t) &&
    ((e.wv = lr()),
    (!I?.is_fork || e.deps === null) &&
      (I === null ? (e.v = t) : (I.capture(e, t, !0), Tt?.capture(e, t, !0)),
      e.deps === null))
  ) {
    P(e, h);
    return;
  }
  Jn || (Et === null ? et(e) : (wn() || I?.is_fork) && Et.set(e, t));
}
function xt(e) {
  if (e.effects !== null)
    for (let t of e.effects)
      (t.teardown || t.ac) &&
        (t.teardown?.(),
        t.ac?.abort(le),
        t.fn !== null && (t.teardown = f),
        (t.ac = null),
        mr(t, 0),
        In(t));
}
function St(e) {
  if (e.effects !== null)
    for (let t of e.effects) t.teardown && t.fn !== null && hr(t);
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
        for (var r of n.d) (P(r, g), t(r));
        for (r of n.m) (P(r, _), t(r));
      }
      this.#p.add(e);
    }
    #g() {
      ((this.#e = !0), Mt++ > 1e3 && (this.#S(), It()));
      for (let e of this.#u) (this.#d.delete(e), P(e, g), this.schedule(e));
      for (let e of this.#d) (P(e, _), this.schedule(e));
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
      e.f ^= h;
      for (var r = e.first; r !== null; ) {
        var i = r.f,
          a = (i & 96) != 0;
        if (!((a && i & 1024) || i & 8192 || this.#f.has(r)) && r.fn !== null) {
          a
            ? (r.f ^= h)
            : i & 4
              ? t.push(r)
              : Ve && i & 16777224
                ? n.push(r)
                : ur(r) && (i & 16 && this.#d.add(r), hr(r));
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
                (this.#d.delete(i), P(i, g), this.schedule(i));
            }
          }
      };
      for (let e of this.current.keys()) t(e);
      (this.oncommit(() => e.discard()), e.#S(), (I = this), this.#g());
    }
    #b(e) {
      for (var t = 0; t < e.length; t += 1) nt(e[t], this.#u, this.#d);
    }
    capture(e, t, n = !1) {
      (e.v !== we && !this.previous.has(e) && this.previous.set(e, e.v),
        e.f & 8388608 || (this.current.set(e, [t, n]), Et?.set(e, t)),
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
      for (let e of this.async_deriveds.values()) e.reject(ht);
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
                  (e.f & 4194320 ? (P(e, g), u.schedule(e)) : u.#u.add(e));
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
      return (this.#s ??= m()).promise;
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
          t === U &&
          (Ve || ((H === null || !(H.f & 2)) && !rt))
        )
          return;
        if (n & 96) {
          if (!(n & 1024)) return;
          t.f ^= h;
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
    _e();
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
        ur(r) &&
        ((Lt = new Set()),
        hr(r),
        r.deps === null &&
          r.first === null &&
          r.nodes === null &&
          r.teardown === null &&
          r.ac === null &&
          Bn(r),
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
            n.f & 24576 || hr(n);
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
        : e & 4194320 && !(e & 2048) && Bt(i, t, r) && (P(i, g), Vt(i));
    }
}
function Bt(e, t, r) {
  let i = r.get(e);
  if (i !== void 0) return i;
  if (e.deps !== null)
    for (let i of e.deps) {
      if (n.call(t, i)) return !0;
      if (i.f & 2 && Bt(i, t, r)) return (r.set(i, !0), !0);
    }
  return (r.set(e, !1), !1);
}
function Vt(e) {
  I.schedule(e);
}
function Ht(e, t) {
  if (!(e.f & 32 && e.f & 1024)) {
    (e.f & 2048 ? t.d.push(e) : e.f & 4096 && t.m.push(e), P(e, h));
    for (var n = e.first; n !== null; ) (Ht(n, t), (n = n.next));
  }
}
function Ut(e) {
  P(e, h);
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
  return (er(n), n);
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
    H !== null &&
      (!Xn || H.f & 131072) &&
      Ke() &&
      H.f & 4325394 &&
      ($n === null || !$n.has(e)) &&
      xe(),
    Yt(e, n ? $t(t) : t, jt)
  );
}
function Yt(e, t, n = null) {
  if (!e.equals(t)) {
    Gt.set(e, Jn ? t : e.v);
    var r = Pt.ensure();
    if ((r.capture(e, t), e.f & 2)) {
      let t = e;
      (e.f & 2048 && yt(t), Et === null && et(t));
    }
    ((e.wv = lr()),
      Qt(e, g, n),
      Ke() &&
        U !== null &&
        U.f & 1024 &&
        !(U.f & 96) &&
        (rr === null ? ir([e]) : rr.push(e)),
      !r.is_fork && Wt.size > 0 && !Kt && Xt());
  }
  return t;
}
function Xt() {
  Kt = !1;
  for (let e of Wt) {
    e.f & 1024 && P(e, _);
    let t;
    try {
      t = ur(e);
    } catch {
      t = !0;
    }
    t && hr(e);
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
      if (!(!i && s === U)) {
        var l = (c & g) === 0;
        if ((l && P(s, t), c & 131072)) Wt.add(s);
        else if (c & 2) {
          var u = s;
          (Et?.delete(u),
            c & 65536 ||
              (c & 512 && (U === null || !(U.f & 2097152)) && (s.f |= ee),
              Qt(u, _, n)));
        } else if (l) {
          var d = s;
          (c & 16 && Lt !== null && Lt.add(d), n === null ? Vt(d) : n.push(d));
        }
      }
    }
}
function $t(t) {
  if (typeof t != `object` || !t || ne in t) return t;
  let n = u(t);
  if (n !== c && n !== l) return t;
  var r = new Map(),
    i = e(t),
    a = L(0),
    s = null,
    d = sr,
    f = (e) => {
      if (sr === d) return e();
      var t = H,
        n = sr;
      (Zn(null), cr(d));
      var r = e();
      return (Zn(t), cr(n), r);
    };
  return (
    i && r.set(`length`, L(t.length, s)),
    new Proxy(t, {
      defineProperty(e, t, n) {
        (!(`value` in n) ||
          n.configurable === !1 ||
          n.enumerable === !1 ||
          n.writable === !1) &&
          ye();
        var i = r.get(t);
        return (
          i === void 0
            ? f(() => {
                var e = L(n.value, s);
                return (r.set(t, e), e);
              })
            : R(i, n.value, !0),
          !0
        );
      },
      deleteProperty(e, t) {
        var n = r.get(t);
        if (n === void 0) {
          if (t in e) {
            let e = f(() => L(we, s));
            (r.set(t, e), Zt(a));
          }
        } else (R(n, we), Zt(a));
        return !0;
      },
      get(e, n, i) {
        if (n === ne) return t;
        var a = r.get(n),
          c = n in e;
        if (
          (a === void 0 &&
            (!c || o(e, n)?.writable) &&
            ((a = f(() => L($t(c ? e[n] : we), s))), r.set(n, a)),
          a !== void 0)
        ) {
          var l = W(a);
          return l === we ? void 0 : l;
        }
        return Reflect.get(e, n, i);
      },
      getOwnPropertyDescriptor(e, t) {
        var n = Reflect.getOwnPropertyDescriptor(e, t);
        if (n && `value` in n) {
          var i = r.get(t);
          i && (n.value = W(i));
        } else if (n === void 0) {
          var a = r.get(t),
            o = a?.v;
          if (a !== void 0 && o !== we)
            return { enumerable: !0, configurable: !0, value: o, writable: !0 };
        }
        return n;
      },
      has(e, t) {
        if (t === ne) return !0;
        var n = r.get(t),
          i = (n !== void 0 && n.v !== we) || Reflect.has(e, t);
        return (n !== void 0 || (U !== null && (!i || o(e, t)?.writable))) &&
          (n === void 0 &&
            ((n = f(() => L(i ? $t(e[t]) : we, s))), r.set(t, n)),
          W(n) === we)
          ? !1
          : i;
      },
      set(e, t, n, c) {
        var l = r.get(t),
          u = t in e;
        if (i && t === `length`)
          for (var d = n; d < l.v; d += 1) {
            var p = r.get(d + ``);
            p === void 0
              ? d in e && ((p = f(() => L(we, s))), r.set(d + ``, p))
              : R(p, we);
          }
        if (l === void 0)
          (!u || o(e, t)?.writable) &&
            ((l = f(() => L(void 0, s))), R(l, $t(n)), r.set(t, l));
        else {
          u = l.v !== we;
          var m = f(() => $t(n));
          R(l, m);
        }
        var h = Reflect.getOwnPropertyDescriptor(e, t);
        if ((h?.set && h.set.call(c, n), !u)) {
          if (i && typeof t == `string`) {
            var g = r.get(`length`),
              _ = Number(t);
            Number.isInteger(_) && _ >= g.v && R(g, _ + 1);
          }
          Zt(a);
        }
        return !0;
      },
      ownKeys(e) {
        W(a);
        var t = Reflect.ownKeys(e).filter((e) => {
          var t = r.get(e);
          return t === void 0 || t.v !== we;
        });
        for (var [n, i] of r) i.v !== we && !(n in e) && t.push(n);
        return t;
      },
      setPrototypeOf() {
        be();
      },
    })
  );
}
function en(e) {
  try {
    if (typeof e == `object` && e && ne in e) return e[ne];
  } catch {}
  return e;
}
function tn(e, t) {
  return Object.is(en(e), en(t));
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
var nn, rn, an, on;
function sn() {
  if (nn === void 0) {
    ((nn = window), (rn = /Firefox/.test(navigator.userAgent)));
    var e = Element.prototype,
      t = Node.prototype,
      n = Text.prototype;
    ((an = o(t, `firstChild`).get),
      (on = o(t, `nextSibling`).get),
      d(e) &&
        ((e[oe] = void 0), (e[ae] = null), (e[se] = void 0), (e.__e = void 0)),
      d(n) && (n[O] = void 0));
  }
}
function cn(e = ``) {
  return document.createTextNode(e);
}
function ln(e) {
  return an.call(e);
}
function un(e) {
  return on.call(e);
}
function z(e, t) {
  if (!A) return ln(e);
  var n = ln(j);
  if (n === null) n = j.appendChild(cn());
  else if (t && n.nodeType !== 3) {
    var r = cn();
    return (n?.before(r), Ne(r), r);
  }
  return (t && hn(n), Ne(n), n);
}
function dn(e, t = !1) {
  if (!A) {
    var n = ln(e);
    return n instanceof Comment && n.data === `` ? un(n) : n;
  }
  if (t) {
    if (j?.nodeType !== 3) {
      var r = cn();
      return (j?.before(r), Ne(r), r);
    }
    hn(j);
  }
  return j;
}
function B(e, t = 1, n = !1) {
  let r = A ? j : e;
  for (var i; t--; ) ((i = r), (r = un(r)));
  if (!A) return r;
  if (n) {
    if (r?.nodeType !== 3) {
      var a = cn();
      return (r === null ? i?.after(a) : r.before(a), Ne(a), a);
    }
    hn(r);
  }
  return (Ne(r), r);
}
function fn(e) {
  e.textContent = ``;
}
function pn() {
  return !Ve || Lt !== null ? !1 : (U.f & b) !== 0;
}
function mn(e, t, n) {
  return t == null || t === `http://www.w3.org/1999/xhtml`
    ? n
      ? document.createElement(e, { is: n })
      : document.createElement(e)
    : n
      ? document.createElementNS(t, e, { is: n })
      : document.createElementNS(t, e);
}
function hn(e) {
  if (e.nodeValue.length < 65536) return;
  let t = e.nextSibling;
  for (; t !== null && t.nodeType === 3; )
    (t.remove(), (e.nodeValue += t.nodeValue), (t = e.nextSibling));
}
function gn(e) {
  A && ln(e) !== null && fn(e);
}
var _n = !1;
function vn() {
  _n ||
    ((_n = !0),
    document.addEventListener(
      `reset`,
      (e) => {
        Promise.resolve().then(() => {
          if (!e.defaultPrevented) for (let t of e.target.elements) t[ce]?.();
        });
      },
      { capture: !0 },
    ));
}
function yn(e) {
  var t = H,
    n = U;
  (Zn(null), Qn(null));
  try {
    return e();
  } finally {
    (Zn(t), Qn(n));
  }
}
function bn(e, t, n, r = n) {
  e.addEventListener(t, () => yn(n));
  let i = e[ce];
  (i
    ? (e[ce] = () => {
        (i(), r(!0));
      })
    : (e[ce] = () => r(!0)),
    vn());
}
function xn(e) {
  (U === null && (H === null && ge(e), he()), Jn && me(e));
}
function Sn(e, t) {
  var n = t.last;
  n === null
    ? (t.last = t.first = e)
    : ((n.next = e), (e.prev = n), (t.last = e));
}
function Cn(e, t) {
  var n = U;
  n !== null && n.f & 8192 && (e |= v);
  var r = {
    ctx: N,
    deps: null,
    nodes: null,
    f: e | g | 512,
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
      hr(r);
    } catch (e) {
      throw (Rn(r), e);
    }
    i.deps === null &&
      i.teardown === null &&
      i.nodes === null &&
      i.first === i.last &&
      !(i.f & 524288) &&
      ((i = i.first), e & 16 && e & 65536 && i !== null && (i.f |= S));
  }
  if (
    i !== null &&
    ((i.parent = n), n !== null && Sn(i, n), H !== null && H.f & 2 && !(e & 64))
  ) {
    var a = H;
    (a.effects ??= []).push(i);
  }
  return r;
}
function wn() {
  return H !== null && !Xn;
}
function Tn(e) {
  let t = Cn(8, null);
  return (P(t, h), (t.teardown = e), t);
}
function En(e) {
  xn(`$effect`);
  var t = U.f;
  if (!H && t & 32 && N !== null && !N.i) {
    var n = N;
    (n.e ??= []).push(e);
  } else return Dn(e);
}
function Dn(e) {
  return Cn(4 | w, e);
}
function On(e) {
  Pt.ensure();
  let t = Cn(64 | C, e);
  return () => {
    Rn(t);
  };
}
function kn(e) {
  Pt.ensure();
  let t = Cn(64 | C, e);
  return (e = {}) =>
    new Promise((n) => {
      e.outro
        ? Vn(t, () => {
            (Rn(t), n(void 0));
          })
        : (Rn(t), n(void 0));
    });
}
function An(e) {
  return Cn(4, e);
}
function jn(e) {
  return Cn(te | C, e);
}
function Mn(e, t = 0) {
  return Cn(8 | t, e);
}
function V(e, t = [], n = [], r = []) {
  ut(r, t, n, (t) => {
    Cn(8, () => {
      e(...t.map(W));
    });
  });
}
function Nn(e, t = 0) {
  return Cn(16 | t, e);
}
function Pn(e) {
  return Cn(32 | C, e);
}
function Fn(e) {
  var t = e.teardown;
  if (t !== null) {
    let e = Jn,
      n = H;
    (Yn(!0), Zn(null));
    try {
      t.call(null);
    } finally {
      (Yn(e), Zn(n));
    }
  }
}
function In(e, t = !1) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    let e = n.ac;
    e !== null &&
      yn(() => {
        e.abort(le);
      });
    var r = n.next;
    (n.f & 64 ? (n.parent = null) : Rn(n, t), (n = r));
  }
}
function Ln(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & 32 || Rn(t), (t = n));
  }
}
function Rn(e, t = !0) {
  var n = !1;
  ((t || e.f & 262144) &&
    e.nodes !== null &&
    e.nodes.end !== null &&
    (zn(e.nodes.start, e.nodes.end), (n = !0)),
    (e.f |= x),
    In(e, t && !n),
    mr(e, 0));
  var r = e.nodes && e.nodes.t;
  if (r !== null) for (let e of r) e.stop();
  (Fn(e), (e.f ^= x), (e.f |= y));
  var i = e.parent;
  (i !== null && i.first !== null && Bn(e),
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
function zn(e, t) {
  for (; e !== null; ) {
    var n = e === t ? null : un(e);
    (e.remove(), (e = n));
  }
}
function Bn(e) {
  var t = e.parent,
    n = e.prev,
    r = e.next;
  (n !== null && (n.next = r),
    r !== null && (r.prev = n),
    t !== null &&
      (t.first === e && (t.first = r), t.last === e && (t.last = n)));
}
function Vn(e, t, n = !0) {
  var r = [];
  Hn(e, r, !0);
  var i = () => {
      (n && Rn(e), t && t());
    },
    a = r.length;
  if (a > 0) {
    var o = () => --a || i();
    for (var s of r) s.out(o);
  } else i();
}
function Hn(e, t, n) {
  if (!(e.f & 8192)) {
    e.f ^= v;
    var r = e.nodes && e.nodes.t;
    if (r !== null) for (let e of r) (e.is_global || n) && t.push(e);
    for (var i = e.first; i !== null; ) {
      var a = i.next;
      if (!(i.f & 64)) {
        var o = (i.f & 65536) != 0 || ((i.f & 32) != 0 && (e.f & 16) != 0);
        Hn(i, t, o ? n : !1);
      }
      i = a;
    }
  }
}
function Un(e) {
  Wn(e, !0);
}
function Wn(e, t) {
  if (e.f & 8192) {
    ((e.f ^= v), e.f & 1024 || (P(e, g), Pt.ensure().schedule(e)));
    for (var n = e.first; n !== null; ) {
      var r = n.next,
        i = (n.f & 65536) != 0 || (n.f & 32) != 0;
      (Wn(n, i ? t : !1), (n = r));
    }
    var a = e.nodes && e.nodes.t;
    if (a !== null) for (let e of a) (e.is_global || t) && e.in();
  }
}
function Gn(e, t) {
  if (e.nodes)
    for (var n = e.nodes.start, r = e.nodes.end; n !== null; ) {
      var i = n === r ? null : un(n);
      (t.append(n), (n = i));
    }
}
var Kn = null,
  qn = !1,
  Jn = !1;
function Yn(e) {
  Jn = e;
}
var H = null,
  Xn = !1;
function Zn(e) {
  H = e;
}
var U = null;
function Qn(e) {
  U = e;
}
var $n = null;
function er(e) {
  H !== null && (!Ve || H.f & 2) && ($n ??= new Set()).add(e);
}
var tr = null,
  nr = 0,
  rr = null;
function ir(e) {
  rr = e;
}
var ar = 1,
  or = 0,
  sr = or;
function cr(e) {
  sr = e;
}
function lr() {
  return ++ar;
}
function ur(e) {
  var t = e.f;
  if (t & 2048) return !0;
  if ((t & 2 && (e.f &= ~ee), t & 4096)) {
    for (var n = e.deps, r = n.length, i = 0; i < r; i++) {
      var a = n[i];
      if ((ur(a) && bt(a), a.wv > e.wv)) return !0;
    }
    t & 512 && Et === null && P(e, h);
  }
  return !1;
}
function dr(e, t, n = !0) {
  var r = e.reactions;
  if (r !== null && !(!Ve && $n !== null && $n.has(e)))
    for (var i = 0; i < r.length; i++) {
      var a = r[i];
      a.f & 2
        ? dr(a, t, !1)
        : t === a && (n ? P(a, g) : a.f & 1024 && P(a, _), Vt(a));
    }
}
function fr(e) {
  var t = tr,
    n = nr,
    r = rr,
    i = H,
    a = $n,
    o = N,
    s = Xn,
    c = sr,
    l = e.f;
  ((tr = null),
    (nr = 0),
    (rr = null),
    (H = l & 96 ? null : e),
    ($n = null),
    Ue(e.ctx),
    (Xn = !1),
    (sr = ++or),
    e.ac !== null &&
      (yn(() => {
        e.ac.abort(le);
      }),
      (e.ac = null)));
  try {
    e.f |= E;
    var u = e.fn,
      d = u();
    e.f |= b;
    var f = e.deps,
      p = I?.is_fork;
    if (tr !== null) {
      var m;
      if ((p || mr(e, nr), f !== null && nr > 0))
        for (f.length = nr + tr.length, m = 0; m < tr.length; m++)
          f[nr + m] = tr[m];
      else e.deps = f = tr;
      if (wn() && e.f & 512)
        for (m = nr; m < f.length; m++) (f[m].reactions ??= []).push(e);
    } else !p && f !== null && nr < f.length && (mr(e, nr), (f.length = nr));
    if (Ke() && rr !== null && !Xn && f !== null && !(e.f & 6146))
      for (m = 0; m < rr.length; m++) dr(rr[m], e);
    if (i !== null && i !== e) {
      if ((or++, i.deps !== null))
        for (let e = 0; e < n; e += 1) i.deps[e].rv = or;
      if (t !== null) for (let e of t) e.rv = or;
      rr !== null && (r === null ? (r = rr) : r.push(...rr));
    }
    return (e.f & 8388608 && (e.f ^= D), d);
  } catch (e) {
    return Ze(e);
  } finally {
    ((e.f ^= E),
      (tr = t),
      (nr = n),
      (rr = r),
      (H = i),
      ($n = a),
      Ue(o),
      (Xn = s),
      (sr = c));
  }
}
function pr(e, r) {
  let i = r.reactions;
  if (i !== null) {
    var a = t.call(i, e);
    if (a !== -1) {
      var o = i.length - 1;
      o === 0 ? (i = r.reactions = null) : ((i[a] = i[o]), i.pop());
    }
  }
  if (i === null && r.f & 2 && (tr === null || !n.call(tr, r))) {
    var s = r;
    (s.f & 512 && ((s.f ^= 512), (s.f &= ~ee)),
      s.v !== we && et(s),
      xt(s),
      mr(s, 0));
  }
}
function mr(e, t) {
  var n = e.deps;
  if (n !== null) for (var r = t; r < n.length; r++) pr(e, n[r]);
}
function hr(e) {
  var t = e.f;
  if (!(t & 16384)) {
    P(e, h);
    var n = U,
      r = qn;
    ((U = e), (qn = !0));
    try {
      (t & 16777232 ? Ln(e) : In(e), Fn(e));
      var i = fr(e);
      ((e.teardown = typeof i == `function` ? i : null), (e.wv = ar));
    } finally {
      ((qn = r), (U = n));
    }
  }
}
async function gr() {
  if (Ve)
    return new Promise((e) => {
      (requestAnimationFrame(() => e()), setTimeout(() => e()));
    });
  (await Promise.resolve(), Ft());
}
function W(e) {
  var t = (e.f & 2) != 0;
  if (
    (Kn?.add(e),
    H !== null &&
      !Xn &&
      !(U !== null && U.f & 16384) &&
      ($n === null || !$n.has(e)))
  ) {
    var r = H.deps;
    if (H.f & 2097152)
      e.rv < or &&
        ((e.rv = or),
        tr === null && r !== null && r[nr] === e
          ? nr++
          : tr === null
            ? (tr = [e])
            : tr.push(e));
    else {
      ((H.deps ??= []), n.call(H.deps, e) || H.deps.push(e));
      var i = e.reactions;
      i === null ? (e.reactions = [H]) : n.call(i, H) || i.push(H);
    }
  }
  if (Jn && Gt.has(e)) return Gt.get(e);
  if (t) {
    var a = e;
    if (Jn) {
      var o = a.v;
      return (
        ((!(a.f & 1024) && a.reactions !== null) || vr(a)) && (o = yt(a)),
        Gt.set(a, o),
        o
      );
    }
    var s = (a.f & 512) == 0 && !Xn && H !== null && (qn || (H.f & 512) != 0),
      c = (a.f & b) === 0;
    (ur(a) && (s && (a.f |= 512), bt(a)), s && !c && (St(a), _r(a)));
  }
  if (Et?.has(e)) return Et.get(e);
  if (e.f & 8388608) throw e.v;
  return e.v;
}
function _r(e) {
  if (((e.f |= 512), e.deps !== null))
    for (let t of e.deps)
      ((t.reactions ??= []).push(e), t.f & 2 && !(t.f & 512) && (St(t), _r(t)));
}
function vr(e) {
  if (e.v === we) return !0;
  if (e.deps === null) return !1;
  for (let t of e.deps) if (Gt.has(t) || (t.f & 2 && vr(t))) return !0;
  return !1;
}
function yr(e) {
  var t = Xn;
  try {
    return ((Xn = !0), e());
  } finally {
    Xn = t;
  }
}
[
  ...`allowfullscreen.async.autofocus.autoplay.checked.controls.default.disabled.formnovalidate.indeterminate.inert.ismap.loop.multiple.muted.nomodule.novalidate.open.playsinline.readonly.required.reversed.seamless.selected.webkitdirectory.defer.disablepictureinpicture.disableremoteplayback`.split(
    `.`,
  ),
];
var br = [`touchstart`, `touchmove`];
function xr(e) {
  return br.includes(e);
}
var Sr = Symbol(`events`),
  Cr = new Set(),
  wr = new Set();
function Tr(e, t, n, r = {}) {
  function i(e) {
    if ((r.capture || kr.call(t, e), !e.cancelBubble))
      return yn(() => n?.call(this, e));
  }
  return (
    e.startsWith(`pointer`) || e.startsWith(`touch`) || e === `wheel`
      ? Ye(() => {
          t.addEventListener(e, i, r);
        })
      : t.addEventListener(e, i, r),
    i
  );
}
function Er(e, t, n, r, i) {
  var a = { capture: r, passive: i },
    o = Tr(e, t, n, a);
  (t === document.body ||
    t === window ||
    t === document ||
    t instanceof HTMLMediaElement) &&
    Tn(() => {
      t.removeEventListener(e, o, a);
    });
}
function G(e, t, n) {
  (t[Sr] ??= {})[e] = n;
}
function Dr(e) {
  for (var t = 0; t < e.length; t++) Cr.add(e[t]);
  for (var n of wr) n(e);
}
var Or = null;
function kr(e) {
  var t = this,
    n = t.ownerDocument,
    r = e.type,
    i = e.composedPath?.() || [],
    o = i[0] || e.target;
  Or = e;
  var s = 0,
    c = Or === e && e[Sr];
  if (c) {
    var l = i.indexOf(c);
    if (l !== -1 && (t === document || t === window)) {
      e[Sr] = t;
      return;
    }
    var u = i.indexOf(t);
    if (u === -1) return;
    l <= u && (s = l);
  }
  if (((o = i[s] || e.target), o !== t)) {
    a(e, `currentTarget`, {
      configurable: !0,
      get() {
        return o || n;
      },
    });
    var d = H,
      f = U;
    (Zn(null), Qn(null));
    try {
      for (var p, m = []; o !== null && o !== t; ) {
        try {
          var h = o[Sr]?.[r];
          h != null && (!o.disabled || e.target === o) && h.call(o, e);
        } catch (e) {
          p ? m.push(e) : (p = e);
        }
        if (e.cancelBubble) break;
        (s++, (o = s < i.length ? i[s] : null));
      }
      if (p) {
        for (let e of m)
          queueMicrotask(() => {
            throw e;
          });
        throw p;
      }
    } finally {
      ((e[Sr] = t), delete e.currentTarget, Zn(d), Qn(f));
    }
  }
}
var Ar =
  globalThis?.window?.trustedTypes &&
  globalThis.window.trustedTypes.createPolicy(`svelte-trusted-html`, {
    createHTML: (e) => e,
  });
function jr(e) {
  return Ar?.createHTML(e) ?? e;
}
function Mr(e) {
  var t = mn(`template`);
  return ((t.innerHTML = jr(e.replaceAll(`<!>`, `<!---->`))), t.content);
}
function Nr(e, t) {
  var n = U;
  n.nodes === null && (n.nodes = { start: e, end: t, a: null, t: null });
}
function K(e, t) {
  var n = (t & 1) != 0,
    r = (t & 2) != 0,
    i,
    a = !e.startsWith(`<!>`);
  return () => {
    if (A) return (Nr(j, null), j);
    i === void 0 && ((i = Mr(a ? e : `<!>` + e)), n || (i = ln(i)));
    var t = r || rn ? document.importNode(i, !0) : i.cloneNode(!0);
    if (n) {
      var o = ln(t),
        s = t.lastChild;
      Nr(o, s);
    } else Nr(t, t);
    return t;
  };
}
function Pr(e, t, n = `svg`) {
  var r = !e.startsWith(`<!>`),
    i = (t & 1) != 0,
    a = `<${n}>${r ? e : `<!>` + e}</${n}>`,
    o;
  return () => {
    if (A) return (Nr(j, null), j);
    if (!o) {
      var e = ln(Mr(a));
      if (i)
        for (o = document.createDocumentFragment(); ln(e); )
          o.appendChild(ln(e));
      else o = ln(e);
    }
    var t = o.cloneNode(!0);
    if (i) {
      var n = ln(t),
        r = t.lastChild;
      Nr(n, r);
    } else Nr(t, t);
    return t;
  };
}
function Fr(e, t) {
  return Pr(e, t, `svg`);
}
function Ir(e = ``) {
  if (!A) {
    var t = cn(e + ``);
    return (Nr(t, t), t);
  }
  var n = j;
  return (
    n.nodeType === 3 ? hn(n) : (n.before((n = cn())), Ne(n)),
    Nr(n, n),
    n
  );
}
function Lr() {
  if (A) return (Nr(j, null), j);
  var e = document.createDocumentFragment(),
    t = document.createComment(``),
    n = cn();
  return (e.append(t, n), Nr(t, n), e);
}
function q(e, t) {
  if (A) {
    var n = U;
    ((!(n.f & 32768) || n.nodes.end === null) && (n.nodes.end = j), Pe());
    return;
  }
  e !== null && e.before(t);
}
function J(e, t) {
  var n = t == null ? `` : typeof t == `object` ? `${t}` : t;
  n !== (e[O] ??= e.nodeValue) && ((e[O] = n), (e.nodeValue = `${n}`));
}
function Rr(e, t) {
  return Vr(e, t);
}
function zr(e, t) {
  (sn(), (t.intro = t.intro ?? !1));
  let n = t.target,
    r = A,
    i = j;
  try {
    for (var a = ln(n); a && (a.nodeType !== 8 || a.data !== `[`); ) a = un(a);
    if (!a) throw Ce;
    (Me(!0), Ne(a));
    let r = Vr(e, { ...t, anchor: a });
    return (Me(!1), r);
  } catch (r) {
    if (
      r instanceof Error &&
      r.message
        .split(
          `
`,
        )
        .some((e) => e.startsWith(`https://svelte.dev/e/`))
    )
      throw r;
    return (
      r !== Ce && console.warn(`Failed to hydrate: `, r),
      t.recover === !1 && ve(),
      sn(),
      fn(n),
      Me(!1),
      Rr(e, t)
    );
  } finally {
    (Me(r), Ne(i));
  }
}
var Br = new Map();
function Vr(
  e,
  {
    target: t,
    anchor: n,
    props: i = {},
    events: a,
    context: o,
    intro: s = !0,
    transformError: c,
  },
) {
  sn();
  var l = void 0,
    u = kn(() => {
      var s = n ?? t.appendChild(cn());
      ct(
        s,
        { pending: () => {} },
        (t) => {
          We({});
          var n = N;
          if (
            (o && (n.c = o),
            a && (i.$$events = a),
            A && Nr(t, null),
            (l = e(t, i) || {}),
            A &&
              ((U.nodes.end = j),
              j === null || j.nodeType !== 8 || j.data !== `]`))
          )
            throw (ke(), Ce);
          Ge();
        },
        c,
      );
      var u = new Set(),
        d = (e) => {
          for (var n = 0; n < e.length; n++) {
            var r = e[n];
            if (!u.has(r)) {
              u.add(r);
              var i = xr(r);
              for (let e of [t, document]) {
                var a = Br.get(e);
                a === void 0 && ((a = new Map()), Br.set(e, a));
                var o = a.get(r);
                o === void 0
                  ? (e.addEventListener(r, kr, { passive: i }), a.set(r, 1))
                  : a.set(r, o + 1);
              }
            }
          }
        };
      return (
        d(r(Cr)),
        wr.add(d),
        () => {
          for (var e of u)
            for (let n of [t, document]) {
              var r = Br.get(n),
                i = r.get(e);
              --i == 0
                ? (n.removeEventListener(e, kr),
                  r.delete(e),
                  r.size === 0 && Br.delete(n))
                : r.set(e, i);
            }
          (wr.delete(d), s !== n && s.parentNode?.removeChild(s));
        }
      );
    });
  return (Hr.set(l, u), l);
}
var Hr = new WeakMap();
function Ur(e, t) {
  let n = Hr.get(e);
  return n ? (Hr.delete(e), n(t)) : Promise.resolve();
}
var Wr = class {
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
      if (n) (Un(n), this.#r.delete(t));
      else {
        var r = this.#n.get(t);
        r &&
          (Un(r.effect),
          this.#t.set(t, r.effect),
          this.#n.delete(t),
          r.fragment.lastChild.remove(),
          this.anchor.before(r.fragment),
          (n = r.effect));
      }
      for (let [t, n] of this.#e) {
        if ((this.#e.delete(t), t === e)) break;
        let r = this.#n.get(n);
        r && (Rn(r.effect), this.#n.delete(n));
      }
      for (let [e, r] of this.#t) {
        if (e === t || this.#r.has(e)) continue;
        let i = () => {
          if (Array.from(this.#e.values()).includes(e)) {
            var t = document.createDocumentFragment();
            (Gn(r, t),
              t.append(cn()),
              this.#n.set(e, { effect: r, fragment: t }));
          } else Rn(r);
          (this.#r.delete(e), this.#t.delete(e));
        };
        this.#i || !n ? (this.#r.add(e), Vn(r, i, !1)) : i();
      }
    }
  };
  #o = (e) => {
    this.#e.delete(e);
    let t = Array.from(this.#e.values());
    for (let [e, n] of this.#n)
      t.includes(e) || (Rn(n.effect), this.#n.delete(e));
  };
  ensure(e, t) {
    var n = I,
      r = pn();
    if (t && !this.#t.has(e) && !this.#n.has(e))
      if (r) {
        var i = document.createDocumentFragment(),
          a = cn();
        (i.append(a), this.#n.set(e, { effect: Pn(() => t(a)), fragment: i }));
      } else
        this.#t.set(
          e,
          Pn(() => t(this.anchor)),
        );
    if ((this.#e.set(n, e), r)) {
      for (let [t, r] of this.#t)
        t === e ? n.unskip_effect(r) : n.skip_effect(r);
      for (let [t, r] of this.#n)
        t === e ? n.unskip_effect(r.effect) : n.skip_effect(r.effect);
      (n.oncommit(this.#a), n.ondiscard(this.#o));
    } else (A && (this.anchor = j), this.#a(n));
  }
};
function Y(e, t, n = !1) {
  var r;
  A && ((r = j), Pe());
  var i = new Wr(e),
    a = n ? S : 0;
  function o(e, t) {
    if (A) {
      var n = Le(r);
      if (e !== parseInt(n.substring(1))) {
        var a = Ie();
        (Ne(a), (i.anchor = a), Me(!1), i.ensure(e, t), Me(!0));
        return;
      }
    }
    i.ensure(e, t);
  }
  Nn(() => {
    var e = !1;
    (t((t, n = 0) => {
      ((e = !0), o(n, t));
    }),
      e || o(-1, null));
  }, a);
}
function Gr(e, t) {
  return t;
}
function Kr(e, t, n) {
  for (var i = [], a = t.length, o, s = t.length, c = 0; c < a; c++) {
    let n = t[c];
    Vn(
      n,
      () => {
        if (o) {
          if ((o.pending.delete(n), o.done.add(n), o.pending.size === 0)) {
            var t = e.outrogroups;
            (qr(e, r(o.done)),
              t.delete(o),
              t.size === 0 && (e.outrogroups = null));
          }
        } else --s;
      },
      !1,
    );
  }
  if (s === 0) {
    var l = i.length === 0 && n !== null;
    if (l) {
      var u = n,
        d = u.parentNode;
      (fn(d), d.append(u), e.items.clear());
    }
    qr(e, t, !l);
  } else
    ((o = { pending: new Set(t), done: new Set() }),
      (e.outrogroups ??= new Set()).add(o));
}
function qr(e, t, n = !0) {
  var r;
  if (e.pending.size > 0) {
    r = new Set();
    for (let t of e.pending.values()) for (let n of t) r.add(e.items.get(n).e);
  }
  for (var i = 0; i < t.length; i++) {
    var a = t[i];
    r?.has(a)
      ? ((a.f |= T), Gn(a, document.createDocumentFragment()))
      : Rn(t[i], n);
  }
}
var Jr;
function Yr(t, n, i, a, o, s = null) {
  var c = t,
    l = new Map();
  if (n & 4) {
    var u = t;
    c = A ? Ne(ln(u)) : u.appendChild(cn());
  }
  A && Pe();
  var d = null,
    f = _t(() => {
      var t = i();
      return e(t) ? t : t == null ? [] : r(t);
    }),
    p,
    m = new Map(),
    h = !0;
  function g(e) {
    v.effect.f & 16384 ||
      (v.pending.delete(e),
      (v.fallback = d),
      Zr(v, p, c, n, a),
      d !== null &&
        (p.length === 0
          ? d.f & 33554432
            ? ((d.f ^= T), $r(d, null, c))
            : Un(d)
          : Vn(d, () => {
              d = null;
            })));
  }
  function _(e) {
    v.pending.delete(e);
  }
  var v = {
    effect: Nn(() => {
      p = W(f);
      var e = p.length;
      let t = !1;
      A &&
        (Le(c) === `[!`) != (e === 0) &&
        ((c = Ie()), Ne(c), Me(!1), (t = !0));
      for (var r = new Set(), u = I, v = pn(), y = 0; y < e; y += 1) {
        A && j.nodeType === 8 && j.data === `]` && ((c = j), (t = !0), Me(!1));
        var b = p[y],
          x = a(b, y),
          S = h ? null : l.get(x);
        (S
          ? (S.v && Yt(S.v, b), S.i && Yt(S.i, y), v && u.unskip_effect(S.e))
          : ((S = Qr(l, h ? c : (Jr ??= cn()), b, x, y, o, n, i)),
            h || (S.e.f |= T),
            l.set(x, S)),
          r.add(x));
      }
      if (
        (e === 0 &&
          s &&
          !d &&
          (h
            ? (d = Pn(() => s(c)))
            : ((d = Pn(() => s((Jr ??= cn())))), (d.f |= T))),
        e > r.size && pe(``, ``, ``),
        A && e > 0 && Ne(Ie()),
        !h)
      )
        if ((m.set(u, r), v)) {
          for (let [e, t] of l) r.has(e) || u.skip_effect(t.e);
          (u.oncommit(g), u.ondiscard(_));
        } else g(u);
      (t && Me(!0), W(f));
    }),
    flags: n,
    items: l,
    pending: m,
    outrogroups: null,
    fallback: d,
  };
  ((h = !1), A && (c = j));
}
function Xr(e) {
  for (; e !== null && !(e.f & 32); ) e = e.next;
  return e;
}
function Zr(e, t, n, i, a) {
  var o = (i & 8) != 0,
    s = t.length,
    c = e.items,
    l = Xr(e.effect.first),
    u,
    d = null,
    f,
    p = [],
    m = [],
    h,
    g,
    _,
    v;
  if (o)
    for (v = 0; v < s; v += 1)
      ((h = t[v]),
        (g = a(h, v)),
        (_ = c.get(g).e),
        _.f & 33554432 || (_.nodes?.a?.measure(), (f ??= new Set()).add(_)));
  for (v = 0; v < s; v += 1) {
    if (((h = t[v]), (g = a(h, v)), (_ = c.get(g).e), e.outrogroups !== null))
      for (let t of e.outrogroups) (t.pending.delete(_), t.done.delete(_));
    if (
      (_.f & 8192 &&
        (Un(_), o && (_.nodes?.a?.unfix(), (f ??= new Set()).delete(_))),
      _.f & 33554432)
    )
      if (((_.f ^= T), _ === l)) $r(_, null, n);
      else {
        var y = d ? d.next : l;
        (_ === e.effect.last && (e.effect.last = _.prev),
          _.prev && (_.prev.next = _.next),
          _.next && (_.next.prev = _.prev),
          ei(e, d, _),
          ei(e, _, y),
          $r(_, y, n),
          (d = _),
          (p = []),
          (m = []),
          (l = Xr(d.next)));
        continue;
      }
    if (_ !== l) {
      if (u !== void 0 && u.has(_)) {
        if (p.length < m.length) {
          var b = m[0],
            x;
          d = b.prev;
          var S = p[0],
            C = p[p.length - 1];
          for (x = 0; x < p.length; x += 1) $r(p[x], b, n);
          for (x = 0; x < m.length; x += 1) u.delete(m[x]);
          (ei(e, S.prev, C.next),
            ei(e, d, S),
            ei(e, C, b),
            (l = b),
            (d = C),
            --v,
            (p = []),
            (m = []));
        } else
          (u.delete(_),
            $r(_, l, n),
            ei(e, _.prev, _.next),
            ei(e, _, d === null ? e.effect.first : d.next),
            ei(e, d, _),
            (d = _));
        continue;
      }
      for (p = [], m = []; l !== null && l !== _; )
        ((u ??= new Set()).add(l), m.push(l), (l = Xr(l.next)));
      if (l === null) continue;
    }
    (_.f & 33554432 || p.push(_), (d = _), (l = Xr(_.next)));
  }
  if (e.outrogroups !== null) {
    for (let t of e.outrogroups)
      t.pending.size === 0 && (qr(e, r(t.done)), e.outrogroups?.delete(t));
    e.outrogroups.size === 0 && (e.outrogroups = null);
  }
  if (l !== null || u !== void 0) {
    var w = [];
    if (u !== void 0) for (_ of u) _.f & 8192 || w.push(_);
    for (; l !== null; )
      (!(l.f & 8192) && l !== e.fallback && w.push(l), (l = Xr(l.next)));
    var ee = w.length;
    if (ee > 0) {
      var E = i & 4 && s === 0 ? n : null;
      if (o) {
        for (v = 0; v < ee; v += 1) w[v].nodes?.a?.measure();
        for (v = 0; v < ee; v += 1) w[v].nodes?.a?.fix();
      }
      Kr(e, w, E);
    }
  }
  o &&
    Ye(() => {
      if (f !== void 0) for (_ of f) _.nodes?.a?.apply();
    });
}
function Qr(e, t, n, r, i, a, o, s) {
  var c = o & 1 ? (o & 16 ? qt(n) : Jt(n, !1, !1)) : null,
    l = o & 2 ? qt(i) : null;
  return {
    v: c,
    i: l,
    e: Pn(
      () => (
        a(t, c ?? n, l ?? i, s),
        () => {
          e.delete(r);
        }
      ),
    ),
  };
}
function $r(e, t, n) {
  if (e.nodes)
    for (
      var r = e.nodes.start,
        i = e.nodes.end,
        a = t && !(t.f & 33554432) ? t.nodes.start : n;
      r !== null;
    ) {
      var o = un(r);
      if ((a.before(r), r === i)) return;
      r = o;
    }
}
function ei(e, t, n) {
  (t === null ? (e.effect.first = n) : (t.next = n),
    n === null ? (e.effect.last = t) : (n.prev = t));
}
function ti(e, t, n = !1, r = !1, i = !1, a = !1) {
  var o = e,
    s = ``;
  if (n) {
    var c = e;
    A && (o = Ne(ln(c)));
  }
  V(() => {
    var e = U;
    if (s === (s = t() ?? ``)) {
      A && Pe();
      return;
    }
    if (n && !A) {
      ((e.nodes = null), (c.innerHTML = s), s !== `` && Nr(ln(c), c.lastChild));
      return;
    }
    if (
      (e.nodes !== null && (zn(e.nodes.start, e.nodes.end), (e.nodes = null)),
      s !== ``)
    ) {
      if (A) {
        for (
          var a = j.data, l = Pe(), u = l;
          l !== null && (l.nodeType !== 8 || l.data !== ``);
        )
          ((u = l), (l = un(l)));
        if (l === null) throw (ke(), Ce);
        (Nr(j, u), (o = Ne(l)));
        return;
      }
      var d = mn(r ? `svg` : i ? `math` : `template`, r ? Ee : i ? De : void 0);
      d.innerHTML = s;
      var f = r || i ? d : d.content;
      if ((Nr(ln(f), f.lastChild), r || i)) for (; ln(f); ) o.before(ln(f));
      else o.before(f);
    }
  });
}
function ni(e, t) {
  An(() => {
    var n = e.getRootNode(),
      r = n.host ? n : (n.head ?? n.ownerDocument.head);
    if (!r.querySelector(`#` + t.hash)) {
      let e = mn(`style`);
      ((e.id = t.hash), (e.textContent = t.code), r.appendChild(e));
    }
  });
}
function ri(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++)
        e[t] && (n = ri(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function ii() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = ri(e)) && (r && (r += ` `), (r += t));
  return r;
}
function ai(e) {
  return typeof e == `object` ? ii(e) : (e ?? ``);
}
var oi = [
  ...` 	
\r\f\xA0\v﻿`,
];
function si(e, t, n) {
  var r = e == null ? `` : `` + e;
  if ((t && (r = r ? r + ` ` + t : t), n)) {
    for (var i of Object.keys(n))
      if (n[i]) r = r ? r + ` ` + i : i;
      else if (r.length)
        for (var a = i.length, o = 0; (o = r.indexOf(i, o)) >= 0; ) {
          var s = o + a;
          (o === 0 || oi.includes(r[o - 1])) &&
          (s === r.length || oi.includes(r[s]))
            ? (r = (o === 0 ? `` : r.substring(0, o)) + r.substring(s + 1))
            : (o = s);
        }
  }
  return r === `` ? null : r;
}
function ci(e, t = !1) {
  var n = t ? ` !important;` : `;`,
    r = ``;
  for (var i of Object.keys(e)) {
    var a = e[i];
    a != null && a !== `` && (r += ` ` + i + `: ` + a + n);
  }
  return r;
}
function li(e) {
  return e[0] !== `-` || e[1] !== `-` ? e.toLowerCase() : e;
}
function ui(e, t) {
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
      (r && c.push(...Object.keys(r).map(li)),
        i && c.push(...Object.keys(i).map(li)));
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
              var p = li(e.substring(l, u).trim());
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
      r && (n += ci(r)),
      i && (n += ci(i, !0)),
      (n = n.trim()),
      n === `` ? null : n
    );
  }
  return e == null ? null : String(e);
}
function X(e, t, n, r, i, a) {
  var o = e[oe];
  if (A || o !== n || o === void 0) {
    var s = si(n, r, a);
    ((!A || s !== e.getAttribute(`class`)) &&
      (s == null
        ? e.removeAttribute(`class`)
        : t
          ? (e.className = s)
          : e.setAttribute(`class`, s)),
      (e[oe] = n));
  } else if (a && i !== a)
    for (var c in a) {
      var l = !!a[c];
      (i == null || l !== !!i[c]) && e.classList.toggle(c, l);
    }
  return a;
}
function di(e, t = {}, n, r) {
  for (var i in n) {
    var a = n[i];
    t[i] !== a &&
      (n[i] == null ? e.style.removeProperty(i) : e.style.setProperty(i, a, r));
  }
}
function fi(e, t, n, r) {
  var i = e[se];
  if (A || i !== t) {
    var a = ui(t, r);
    ((!A || a !== e.getAttribute(`style`)) &&
      (a == null ? e.removeAttribute(`style`) : (e.style.cssText = a)),
      (e[se] = t));
  } else
    r &&
      (Array.isArray(r)
        ? (di(e, n?.[0], r[0]), di(e, n?.[1], r[1], `important`))
        : di(e, n, r));
  return r;
}
function pi(t, n, r = !1) {
  if (t.multiple) {
    if (n == null) return;
    if (!e(n)) return Ae();
    for (var i of t.options) i.selected = n.includes(gi(i));
    return;
  }
  for (i of t.options)
    if (tn(gi(i), n)) {
      i.selected = !0;
      return;
    }
  (!r || n !== void 0) && (t.selectedIndex = -1);
}
function mi(e) {
  var t = new MutationObserver(() => {
    pi(e, e.__value);
  });
  (t.observe(e, {
    childList: !0,
    subtree: !0,
    attributes: !0,
    attributeFilter: [`value`],
  }),
    Tn(() => {
      t.disconnect();
    }));
}
function hi(e, t, n = t) {
  var r = new WeakSet(),
    i = !0;
  (bn(e, `change`, (t) => {
    var i = t ? `[selected]` : `:checked`,
      a;
    if (e.multiple) a = [].map.call(e.querySelectorAll(i), gi);
    else {
      var o = e.querySelector(i) ?? e.querySelector(`option:not([disabled])`);
      a = o && gi(o);
    }
    (n(a), (e.__value = a), I !== null && r.add(I));
  }),
    An(() => {
      var a = t();
      if (e === document.activeElement) {
        var o = Ve ? Tt : I;
        if (r.has(o)) return;
      }
      if ((pi(e, a, i), i && a === void 0)) {
        var s = e.querySelector(`:checked`);
        s !== null && ((a = gi(s)), n(a));
      }
      ((e.__value = a), (i = !1));
    }),
    mi(e));
}
function gi(e) {
  return `__value` in e ? e.__value : e.value;
}
var _i = Symbol(`is custom element`),
  vi = Symbol(`is html`),
  yi = ue ? `link` : `LINK`;
function bi(e) {
  if (A) {
    var t = !1,
      n = () => {
        if (!t) {
          if (((t = !0), e.hasAttribute(`value`))) {
            var n = e.value;
            (xi(e, `value`, null), (e.value = n));
          }
          if (e.hasAttribute(`checked`)) {
            var r = e.checked;
            (xi(e, `checked`, null), (e.checked = r));
          }
        }
      };
    ((e[ce] = n), Ye(n), vn());
  }
}
function xi(e, t, n, r) {
  var i = Si(e);
  (A &&
    ((i[t] = e.getAttribute(t)),
    t === `src` || t === `srcset` || (t === `href` && e.nodeName === yi))) ||
    (i[t] !== (i[t] = n) &&
      (t === `loading` && (e[ie] = n),
      n == null
        ? e.removeAttribute(t)
        : typeof n != `string` && wi(e).includes(t)
          ? (e[t] = n)
          : e.setAttribute(t, n)));
}
function Si(e) {
  return (e[ae] ??= {
    [_i]: e.nodeName.includes(`-`),
    [vi]: e.namespaceURI === Te,
  });
}
var Ci = new Map();
function wi(e) {
  var t = e.getAttribute(`is`) || e.nodeName,
    n = Ci.get(t);
  if (n) return n;
  Ci.set(t, (n = []));
  for (var r, i = e, a = Element.prototype; a !== i; ) {
    for (var o in ((r = s(i)), r))
      r[o].set &&
        o !== `innerHTML` &&
        o !== `textContent` &&
        o !== `innerText` &&
        n.push(o);
    i = u(i);
  }
  return n;
}
function Ti(e, t, n = t) {
  var r = new WeakSet();
  (bn(e, `input`, async (i) => {
    var a = i ? e.defaultValue : e.value;
    if (
      ((a = Ei(e) ? Di(a) : a),
      n(a),
      I !== null && r.add(I),
      await gr(),
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
    ((A && e.defaultValue !== e.value) || (yr(t) == null && e.value)) &&
      (n(Ei(e) ? Di(e.value) : e.value), I !== null && r.add(I)),
    Mn(() => {
      var n = t();
      if (e === document.activeElement) {
        var i = Ve ? Tt : I;
        if (r.has(i)) return;
      }
      (Ei(e) && n === Di(e.value)) ||
        (e.type === `date` && !n && !e.value) ||
        (n !== e.value && (e.value = n ?? ``));
    }));
}
function Ei(e) {
  var t = e.type;
  return t === `number` || t === `range`;
}
function Di(e) {
  return e === `` ? null : +e;
}
function Oi(e, t) {
  return e === t || e?.[ne] === t;
}
function ki(e = {}, t, n, r) {
  var i = N.r,
    a = U;
  return (
    An(() => {
      var o, s;
      return (
        Mn(() => {
          ((o = s),
            (s = r?.() || []),
            yr(() => {
              Oi(n(...s), e) ||
                (t(e, ...s), o && Oi(n(...o), e) && t(null, ...o));
            }));
        }),
        () => {
          let r = a;
          for (; r !== i && r.parent !== null && r.parent.f & 33554432; )
            r = r.parent;
          let o = () => {
              s && Oi(n(...s), e) && t(null, ...s);
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
function Ai(e, t, n, r) {
  var i = !He || (n & 2) != 0,
    a = (n & 8) != 0,
    s = (n & 16) != 0,
    c = r,
    l = !0,
    u = void 0,
    d = () =>
      s && i
        ? ((u ??= mt(r)), W(u))
        : (l && ((l = !1), (c = s ? yr(r) : r)), c);
  let f;
  if (a) {
    var p = ne in e || re in e;
    f = o(e, t)?.set ?? (p && t in e ? (n) => (e[t] = n) : void 0);
  }
  var m,
    h = !1;
  (a ? ([m, h] = at(() => e[t])) : (m = e[t]),
    m === void 0 && r !== void 0 && ((m = d()), f && (i && k(t), f(m))));
  var g = i
    ? () => {
        var n = e[t];
        return n === void 0 ? d() : ((l = !0), n);
      }
    : () => {
        var n = e[t];
        return (n !== void 0 && (c = void 0), n === void 0 ? c : n);
      };
  if (i && !(n & 4)) return g;
  if (f) {
    var _ = e.$$legacy;
    return function (e, t) {
      return arguments.length > 0
        ? ((!i || !t || _ || h) && f(t ? g() : e), e)
        : g();
    };
  }
  var v = !1,
    y = (n & 1 ? mt : _t)(() => ((v = !1), g()));
  a && W(y);
  var b = U;
  return function (e, t) {
    if (arguments.length > 0) {
      let n = t ? W(y) : i && a ? $t(e) : e;
      return (R(y, n), (v = !0), c !== void 0 && (c = n), e);
    }
    return (Jn && v) || b.f & 16384 ? y.v : W(y);
  };
}
function ji(e) {
  return new Mi(e);
}
var Mi = class {
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
            return W(t.get(r) ?? n(r, Reflect.get(e, r)));
          },
          has(e, r) {
            return r === re
              ? !0
              : (W(t.get(r) ?? n(r, Reflect.get(e, r))), Reflect.has(e, r));
          },
          set(e, r, i) {
            return (R(t.get(r) ?? n(r, i), i), Reflect.set(e, r, i));
          },
        },
      );
      ((this.#t = (e.hydrate ? zr : Rr)(e.component, {
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
          a(this, e, {
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
          Ur(this.#t);
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
  Ni;
typeof HTMLElement == `function` &&
  (Ni = class extends HTMLElement {
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
      if (((this.$$l[e] = this.$$l[e] || []), this.$$l[e].push(t), this.$$c)) {
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
            let n = mn(`slot`);
            (e !== "default" && (n.name = e), q(t, n));
          };
        }
        let t = {},
          n = Fi(this);
        for (let r of this.$$s)
          r in n &&
            (r === "default" && !this.$$d.children
              ? ((this.$$d.children = e(r)), (t.default = !0))
              : (t[r] = e(r)));
        for (let e of this.attributes) {
          let t = this.$$g_p(e.name);
          t in this.$$d || (this.$$d[t] = Pi(t, e.value, this.$$p_d, `toProp`));
        }
        for (let e in this.$$p_d)
          !(e in this.$$d) &&
            this[e] !== void 0 &&
            ((this.$$d[e] = this[e]), delete this[e]);
        ((this.$$c = ji({
          component: this.$$ctor,
          target: this.$$shadowRoot || this,
          props: { ...this.$$d, $$slots: t, $$host: this },
        })),
          (this.$$me = On(() => {
            Mn(() => {
              this.$$r = !0;
              for (let e of i(this.$$c)) {
                if (!this.$$p_d[e]?.reflect) continue;
                this.$$d[e] = this.$$c[e];
                let t = Pi(e, this.$$d[e], this.$$p_d, `toAttribute`);
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
        (this.$$d[e] = Pi(e, n, this.$$p_d, `toProp`)),
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
        i(this.$$p_d).find(
          (t) =>
            this.$$p_d[t].attribute === e ||
            (!this.$$p_d[t].attribute && t.toLowerCase() === e),
        ) || e
      );
    }
  });
function Pi(e, t, n, r) {
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
function Fi(e) {
  let t = {};
  return (
    e.childNodes.forEach((e) => {
      t[e.slot || `default`] = !0;
    }),
    t
  );
}
function Ii(e, t, n, r, s, c) {
  let l = class extends Ni {
    constructor() {
      (super(e, n, s), (this.$$p_d = t));
    }
    static get observedAttributes() {
      return i(t).map((e) => (t[e].attribute || e).toLowerCase());
    }
  };
  return (
    i(t).forEach((e) => {
      a(l.prototype, e, {
        get() {
          return this.$$c && e in this.$$c ? this.$$c[e] : this.$$d[e];
        },
        set(n) {
          ((n = Pi(e, n, t)), (this.$$d[e] = n));
          var r = this.$$c;
          r && (o(r, e)?.get ? (r[e] = n) : r.$set({ [e]: n }));
        },
      });
    }),
    r.forEach((e) => {
      a(l.prototype, e, {
        get() {
          return this.$$c?.[e];
        },
      });
    }),
    c && (l = c(l)),
    (e.element = l),
    l
  );
}
function Li(e) {
  (N === null && de(`onMount`),
    He && N.l !== null
      ? zi(N).m.push(e)
      : En(() => {
          let t = yr(e);
          if (typeof t == `function`) return t;
        }));
}
function Ri(e) {
  (N === null && de(`onDestroy`), Li(() => () => yr(e)));
}
function zi(e) {
  var t = e.l;
  return (t.u ??= { a: [], b: [], m: [] });
}
typeof window < `u` && ((window.__svelte ??= {}).v ??= new Set()).add(`5`);
var Bi = () => window.location.origin,
  Vi = (e) => `${Bi()}${e.startsWith(`/`) ? e : `/${e}`}`,
  Hi = () => localStorage.getItem(`knovana_token`),
  Ui = (e) => {
    localStorage.setItem(`knovana_token`, e);
  },
  Wi = () => {
    localStorage.removeItem(`knovana_token`);
  },
  Gi = async (e, t = {}) => {
    let n = Vi(e),
      r = Hi(),
      i = new Headers(t.headers || {});
    (r && i.set(`Authorization`, `Bearer ${r}`),
      !i.has(`Content-Type`) &&
        !(t.body instanceof FormData) &&
        i.set(`Content-Type`, `application/json`));
    let a = { ...t, headers: i };
    try {
      let e = await fetch(n, a),
        t = e.status;
      if (t === 204) return { data: null, error: null, status: t };
      let r = await e.json();
      return e.ok
        ? { data: r, error: null, status: t }
        : {
            data: null,
            error: r.error || {
              code: `API_ERROR`,
              message: r.message || e.statusText || `Request failed`,
            },
            status: t,
          };
    } catch (e) {
      return {
        data: null,
        error: {
          code: `NETWORK_ERROR`,
          message:
            e.message ||
            `Network request failed. Is the backend server running?`,
        },
        status: 500,
      };
    }
  },
  Ki = K(
    `<div class="form-group svelte-h34f85"><label for="confirm-password" class="svelte-h34f85">确认密码</label> <input type="password" id="confirm-password" class="paper-input" placeholder="确认输入密码" required=""/></div>`,
  ),
  qi = K(`<div class="error-banner svelte-h34f85"> </div>`),
  Ji = K(
    `<div class="login-wrapper svelte-h34f85"><div class="paper-card login-card svelte-h34f85"><div class="brand-header svelte-h34f85"><div class="brand-logo svelte-h34f85">📚</div> <h1>Knovana</h1> <p class="subtitle svelte-h34f85">个人知识管理控制台</p></div> <form><div class="form-group svelte-h34f85"><label for="username" class="svelte-h34f85">用户名</label> <input type="text" id="username" class="paper-input" placeholder="输入用户名" required=""/></div> <div class="form-group svelte-h34f85"><label for="password" class="svelte-h34f85">密码</label> <input type="password" id="password" class="paper-input" placeholder="输入密码" required=""/></div> <!> <!> <button type="submit" class="paper-button primary submit-btn svelte-h34f85"> </button></form> <div class="toggle-footer svelte-h34f85"><a href="javascript:void(0)"> </a></div></div></div>`,
  );
function Yi(e, t) {
  We(t, !0);
  let n = Ai(t, `onSuccess`, 3, () => {}),
    r = L(!1),
    i = L(``),
    a = L(``),
    o = L(``),
    s = L(!1),
    c = L(``);
  async function l(e) {
    if ((e.preventDefault(), R(c, ``), !W(i) || !W(a))) {
      R(c, `请填写用户名和密码`);
      return;
    }
    if (W(r) && W(a) !== W(o)) {
      R(c, `两次输入的密码不一致`);
      return;
    }
    R(s, !0);
    let t = W(r) ? `/api/v1/auth/register` : `/api/v1/auth/login`;
    try {
      let e = await Gi(t, {
        method: `POST`,
        body: JSON.stringify({ username: W(i), password: W(a) }),
      });
      e.error
        ? R(c, e.error.message, !0)
        : e.data?.token
          ? (Ui(e.data.token), n()())
          : R(c, `未获取到有效的登录凭证`);
    } finally {
      R(s, !1);
    }
  }
  function u() {
    (R(r, !W(r)), R(c, ``), R(a, ``), R(o, ``));
  }
  var d = Ji(),
    f = z(d),
    p = B(z(f), 2),
    m = z(p),
    h = B(z(m), 2);
  (bi(h), M(m));
  var g = B(m, 2),
    _ = B(z(g), 2);
  (bi(_), M(g));
  var v = B(g, 2),
    y = (e) => {
      var t = Ki(),
        n = B(z(t), 2);
      (bi(n),
        M(t),
        V(() => (n.disabled = W(s))),
        Ti(
          n,
          () => W(o),
          (e) => R(o, e),
        ),
        q(e, t));
    };
  Y(v, (e) => {
    W(r) && e(y);
  });
  var b = B(v, 2),
    x = (e) => {
      var t = qi(),
        n = z(t);
      (M(t), V(() => J(n, `⚠️ ${W(c) ?? ``}`)), q(e, t));
    };
  Y(b, (e) => {
    W(c) && e(x);
  });
  var S = B(b, 2),
    C = z(S, !0);
  (M(S), M(p));
  var w = B(p, 2),
    T = z(w),
    ee = z(T, !0);
  (M(T),
    M(w),
    M(f),
    M(d),
    V(() => {
      ((h.disabled = W(s)),
        (_.disabled = W(s)),
        (S.disabled = W(s)),
        J(C, W(s) ? `处理中...` : W(r) ? `注册新账号` : `登录系统`),
        J(ee, W(r) ? `已有账号？立即登录` : `没有账号？创建新用户`));
    }),
    Er(`submit`, p, l),
    Ti(
      h,
      () => W(i),
      (e) => R(i, e),
    ),
    Ti(
      _,
      () => W(a),
      (e) => R(a, e),
    ),
    G(`click`, T, u),
    q(e, d),
    Ge());
}
Dr([`click`]);
var Xi = K(`<h2 class="svelte-181dlmc">Knovana</h2>`),
  Zi = Fr(
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg>`,
  ),
  Qi = Fr(
    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"></path></svg>`,
  ),
  $i = K(
    `<button><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> <!></button>`,
  ),
  ea = K(
    `<span class="profile-badge admin-badge svelte-181dlmc">管理员</span>`,
  ),
  ta = K(
    `<span class="profile-badge user-badge svelte-181dlmc">普通用户</span>`,
  ),
  na = K(
    `<span class="status-badge active-badge svelte-181dlmc">已激活</span>`,
  ),
  ra = K(
    `<span class="status-badge inactive-badge svelte-181dlmc">待激活</span>`,
  ),
  ia = K(
    `<div class="profile-card svelte-181dlmc"><div class="profile-avatar svelte-181dlmc">👤</div> <div class="profile-info svelte-181dlmc"><div class="profile-name svelte-181dlmc"> </div> <div class="badges-row svelte-181dlmc"><!> <!></div></div></div>`,
  ),
  aa = K(`<div class="profile-avatar-collapsed svelte-181dlmc">👤</div>`),
  oa = K(
    `<div><div class="top-sec svelte-181dlmc"><div class="brand svelte-181dlmc"><div class="brand-left svelte-181dlmc"><span class="logo svelte-181dlmc">📚</span> <!></div> <button class="collapse-toggle-btn svelte-181dlmc"><!></button></div> <div class="nav-links svelte-181dlmc"><button><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> <!></button> <button><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle></svg> <!></button> <!></div></div> <div class="bottom-sec svelte-181dlmc"><!> <button class="logout-btn svelte-181dlmc"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg> <!></button></div></div>`,
  );
function sa(e, t) {
  We(t, !0);
  let n = Ai(t, `activeTab`, 3, `knowledge`),
    r = Ai(t, `isAdmin`, 3, !1),
    i = Ai(t, `username`, 3, ``),
    a = Ai(t, `status`, 3, `inactive`),
    o = Ai(t, `isCollapsed`, 3, !1),
    s = Ai(t, `onToggleCollapse`, 3, () => {}),
    c = Ai(t, `onTabChange`, 3, () => {}),
    l = Ai(t, `onLogout`, 3, () => {});
  var u = oa(),
    d = z(u),
    f = z(d),
    p = z(f),
    m = B(z(p), 2),
    h = (e) => {
      q(e, Xi());
    };
  (Y(m, (e) => {
    o() || e(h);
  }),
    M(p));
  var g = B(p, 2),
    _ = z(g),
    v = (e) => {
      q(e, Zi());
    },
    y = (e) => {
      q(e, Qi());
    };
  (Y(_, (e) => {
    o() ? e(v) : e(y, -1);
  }),
    M(g),
    M(f));
  var b = B(f, 2),
    x = z(b),
    S = B(z(x), 2),
    C = (e) => {
      q(e, Ir(`浏览知识库`));
    };
  (Y(S, (e) => {
    o() || e(C);
  }),
    M(x));
  var w = B(x, 2),
    T = B(z(w), 2),
    ee = (e) => {
      q(e, Ir(`管理密钥`));
    };
  (Y(T, (e) => {
    o() || e(ee);
  }),
    M(w));
  var E = B(w, 2),
    te = (e) => {
      var t = $i(),
        r = B(z(t), 2),
        i = (e) => {
          q(e, Ir(`用户管理`));
        };
      (Y(r, (e) => {
        o() || e(i);
      }),
        M(t),
        V(() => {
          (X(
            t,
            1,
            `nav-btn ${n() === `users` ? `active` : ``}`,
            `svelte-181dlmc`,
          ),
            xi(t, `title`, o() ? `用户管理` : ``));
        }),
        G(`click`, t, () => c()(`users`)),
        q(e, t));
    };
  (Y(E, (e) => {
    r() && e(te);
  }),
    M(b),
    M(d));
  var D = B(d, 2),
    ne = z(D),
    re = (e) => {
      var t = ia(),
        n = B(z(t), 2),
        o = z(n),
        s = z(o, !0);
      M(o);
      var c = B(o, 2),
        l = z(c),
        u = (e) => {
          q(e, ea());
        },
        d = (e) => {
          q(e, ta());
        };
      Y(l, (e) => {
        r() ? e(u) : e(d, -1);
      });
      var f = B(l, 2),
        p = (e) => {
          q(e, na());
        },
        m = (e) => {
          q(e, ra());
        };
      (Y(f, (e) => {
        a() === `active` ? e(p) : e(m, -1);
      }),
        M(c),
        M(n),
        M(t),
        V(() => {
          (xi(o, `title`, i()), J(s, i()));
        }),
        q(e, t));
    },
    ie = (e) => {
      var t = aa();
      (V(() =>
        xi(
          t,
          `title`,
          `${i() ?? ``} (${r() ? `管理员` : `普通用户`} - ${a() === `active` ? `已激活` : `待激活`})`,
        ),
      ),
        q(e, t));
    };
  Y(ne, (e) => {
    o() ? e(ie, -1) : e(re);
  });
  var ae = B(ne, 2),
    oe = B(z(ae), 2),
    se = (e) => {
      q(e, Ir(`安全退出`));
    };
  (Y(oe, (e) => {
    o() || e(se);
  }),
    M(ae),
    M(D),
    M(u),
    V(() => {
      (X(u, 1, `sidebar ${o() ? `collapsed` : ``}`, `svelte-181dlmc`),
        xi(g, `title`, o() ? `展开侧边栏` : `折叠侧边栏`),
        xi(g, `aria-label`, o() ? `展开侧边栏` : `折叠侧边栏`),
        X(
          x,
          1,
          `nav-btn ${n() === `knowledge` ? `active` : ``}`,
          `svelte-181dlmc`,
        ),
        xi(x, `title`, o() ? `浏览知识库` : ``),
        X(w, 1, `nav-btn ${n() === `keys` ? `active` : ``}`, `svelte-181dlmc`),
        xi(w, `title`, o() ? `管理密钥` : ``),
        xi(ae, `title`, o() ? `安全退出` : ``));
    }),
    G(`click`, g, function (...e) {
      s()?.apply(this, e);
    }),
    G(`click`, x, () => c()(`knowledge`)),
    G(`click`, w, () => c()(`keys`)),
    G(`click`, ae, function (...e) {
      l()?.apply(this, e);
    }),
    q(e, u),
    Ge());
}
Dr([`click`]);
function ca() {
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
var la = ca();
function ua(e) {
  la = e;
}
var da = { exec: () => null };
function fa(e) {
  let t = [];
  return (n) => {
    let r = Math.max(0, Math.min(3, n - 1)),
      i = t[r];
    return (i || ((i = e(r)), (t[r] = i)), i);
  };
}
function Z(e, t = ``) {
  let n = typeof e == `string` ? e : e.source,
    r = {
      replace: (e, t) => {
        let i = typeof t == `string` ? t : t.source;
        return ((i = i.replace(ma.caret, `$1`)), (n = n.replace(e, i)), r);
      },
      getRegex: () => new RegExp(n, t),
    };
  return r;
}
var pa = ((e = ``) => {
    try {
      return !!RegExp(`(?<=1)(?<!1)` + e);
    } catch {
      return !1;
    }
  })(),
  ma = {
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
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
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
    nextBulletRegex: fa((e) =>
      RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),
    ),
    hrRegex: fa((e) =>
      RegExp(`^ {0,${e}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),
    ),
    fencesBeginRegex: fa((e) => RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),
    headingBeginRegex: fa((e) => RegExp(`^ {0,${e}}#`)),
    htmlBeginRegex: fa((e) => RegExp(`^ {0,${e}}<(?:[a-z].*>|!--)`, `i`)),
    blockquoteBeginRegex: fa((e) => RegExp(`^ {0,${e}}>`)),
  },
  ha = /^(?:[ \t]*(?:\n|$))+/,
  ga = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,
  _a =
    /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  va = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
  ya = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  ba = / {0,3}(?:[*+-]|\d{1,9}[.)])/,
  xa =
    /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  Sa = Z(xa)
    .replace(/bull/g, ba)
    .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
    .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
    .replace(/blockquote/g, / {0,3}>/)
    .replace(/heading/g, / {0,3}#{1,6}/)
    .replace(/html/g, / {0,3}<[^\n>]+>\n/)
    .replace(/\|table/g, ``)
    .getRegex(),
  Ca = Z(xa)
    .replace(/bull/g, ba)
    .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
    .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
    .replace(/blockquote/g, / {0,3}>/)
    .replace(/heading/g, / {0,3}#{1,6}/)
    .replace(/html/g, / {0,3}<[^\n>]+>\n/)
    .replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/)
    .getRegex(),
  wa =
    /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  Ta = /^[^\n]+/,
  Ea = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,
  Da = Z(
    /^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/,
  )
    .replace(`label`, Ea)
    .replace(
      `title`,
      /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
    )
    .getRegex(),
  Oa = Z(/^(bull)([ \t][^\n]*?)?(?:\n|$)/)
    .replace(/bull/g, ba)
    .getRegex(),
  ka = `address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,
  Aa = /<!--(?:-?>|[\s\S]*?(?:-->|$))/,
  ja = Z(
    `^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))`,
    `i`,
  )
    .replace(`comment`, Aa)
    .replace(`tag`, ka)
    .replace(
      `attribute`,
      / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/,
    )
    .getRegex(),
  Ma = Z(wa)
    .replace(`hr`, va)
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
    .replace(`tag`, ka)
    .getRegex(),
  Na = {
    blockquote: Z(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/)
      .replace(`paragraph`, Ma)
      .getRegex(),
    code: ga,
    def: Da,
    fences: _a,
    heading: ya,
    hr: va,
    html: ja,
    lheading: Sa,
    list: Oa,
    newline: ha,
    paragraph: Ma,
    table: da,
    text: Ta,
  },
  Pa = Z(
    `^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)`,
  )
    .replace(`hr`, va)
    .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
    .replace(`blockquote`, ` {0,3}>`)
    .replace(`code`, `(?: {4}| {0,3}	)[^\\n]`)
    .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
    .replace(`list`, ` {0,3}(?:[*+-]|1[.)])[ \\t]`)
    .replace(
      `html`,
      `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
    )
    .replace(`tag`, ka)
    .getRegex(),
  Fa = {
    ...Na,
    lheading: Ca,
    table: Pa,
    paragraph: Z(wa)
      .replace(`hr`, va)
      .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
      .replace(`|lheading`, ``)
      .replace(`table`, Pa)
      .replace(`blockquote`, ` {0,3}>`)
      .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
      .replace(`list`, ` {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]`)
      .replace(
        `html`,
        `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
      )
      .replace(`tag`, ka)
      .getRegex(),
  },
  Ia = {
    ...Na,
    html: Z(
      `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`,
    )
      .replace(`comment`, Aa)
      .replace(
        /tag/g,
        `(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b`,
      )
      .getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: da,
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: Z(wa)
      .replace(`hr`, va)
      .replace(
        `heading`,
        ` *#{1,6} *[^
]`,
      )
      .replace(`lheading`, Sa)
      .replace(`|table`, ``)
      .replace(`blockquote`, ` {0,3}>`)
      .replace(`|fences`, ``)
      .replace(`|list`, ``)
      .replace(`|html`, ``)
      .replace(`|tag`, ``)
      .getRegex(),
  },
  La = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  Ra = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  za = /^( {2,}|\\)\n(?!\s*$)/,
  Ba =
    /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  Va = /[\p{P}\p{S}]/u,
  Ha = /[\s\p{P}\p{S}]/u,
  Ua = /[^\s\p{P}\p{S}]/u,
  Wa = Z(/^((?![*_])punctSpace)/, `u`)
    .replace(/punctSpace/g, Ha)
    .getRegex(),
  Ga = /(?!~)[\p{P}\p{S}]/u,
  Ka = /(?!~)[\s\p{P}\p{S}]/u,
  qa = /(?:[^\s\p{P}\p{S}]|~)/u,
  Ja = Z(/link|precode-code|html/, `g`)
    .replace(
      `link`,
      /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/,
    )
    .replace(`precode-`, pa ? "(?<!`)()" : "(^^|[^`])")
    .replace(`code`, /(?<b>`+)[^`]+\k<b>(?!`)/)
    .replace(`html`, /<(?! )[^<>]*?>/)
    .getRegex(),
  Ya = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,
  Xa = Z(Ya, `u`).replace(/punct/g, Va).getRegex(),
  Za = Z(Ya, `u`).replace(/punct/g, Ga).getRegex(),
  Qa = `^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)`,
  $a = Z(Qa, `gu`)
    .replace(/notPunctSpace/g, Ua)
    .replace(/punctSpace/g, Ha)
    .replace(/punct/g, Va)
    .getRegex(),
  eo = Z(Qa, `gu`)
    .replace(/notPunctSpace/g, qa)
    .replace(/punctSpace/g, Ka)
    .replace(/punct/g, Ga)
    .getRegex(),
  to = Z(
    `^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)`,
    `gu`,
  )
    .replace(/notPunctSpace/g, Ua)
    .replace(/punctSpace/g, Ha)
    .replace(/punct/g, Va)
    .getRegex(),
  no = Z(/^~~?(?:((?!~)punct)|[^\s~])/, `u`)
    .replace(/punct/g, Va)
    .getRegex(),
  ro = Z(
    `^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)`,
    `gu`,
  )
    .replace(/notPunctSpace/g, Ua)
    .replace(/punctSpace/g, Ha)
    .replace(/punct/g, Va)
    .getRegex(),
  io = Z(/\\(punct)/, `gu`)
    .replace(/punct/g, Va)
    .getRegex(),
  ao = Z(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
    .replace(`scheme`, /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
    .replace(
      `email`,
      /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
    )
    .getRegex(),
  oo = Z(Aa).replace(`(?:-->|$)`, `-->`).getRegex(),
  so = Z(
    `^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`,
  )
    .replace(`comment`, oo)
    .replace(
      `attribute`,
      /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/,
    )
    .getRegex(),
  co =
    /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/,
  lo = Z(
    /^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/,
  )
    .replace(`label`, co)
    .replace(`href`, /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/)
    .replace(
      `title`,
      /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/,
    )
    .getRegex(),
  uo = Z(/^!?\[(label)\]\[(ref)\]/)
    .replace(`label`, co)
    .replace(`ref`, Ea)
    .getRegex(),
  fo = Z(/^!?\[(ref)\](?:\[\])?/)
    .replace(`ref`, Ea)
    .getRegex(),
  po = Z(`reflink|nolink(?!\\()`, `g`)
    .replace(`reflink`, uo)
    .replace(`nolink`, fo)
    .getRegex(),
  mo = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,
  ho = {
    _backpedal: da,
    anyPunctuation: io,
    autolink: ao,
    blockSkip: Ja,
    br: za,
    code: Ra,
    del: da,
    delLDelim: da,
    delRDelim: da,
    emStrongLDelim: Xa,
    emStrongRDelimAst: $a,
    emStrongRDelimUnd: to,
    escape: La,
    link: lo,
    nolink: fo,
    punctuation: Wa,
    reflink: uo,
    reflinkSearch: po,
    tag: so,
    text: Ba,
    url: da,
  },
  go = {
    ...ho,
    link: Z(/^!?\[(label)\]\((.*?)\)/)
      .replace(`label`, co)
      .getRegex(),
    reflink: Z(/^!?\[(label)\]\s*\[([^\]]*)\]/)
      .replace(`label`, co)
      .getRegex(),
  },
  _o = {
    ...ho,
    emStrongRDelimAst: eo,
    emStrongLDelim: Za,
    delLDelim: no,
    delRDelim: ro,
    url: Z(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/)
      .replace(`protocol`, mo)
      .replace(
        `email`,
        /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
      )
      .getRegex(),
    _backpedal:
      /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
    text: Z(
      /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/,
    )
      .replace(`protocol`, mo)
      .getRegex(),
  },
  vo = {
    ..._o,
    br: Z(za).replace(`{2,}`, `*`).getRegex(),
    text: Z(_o.text)
      .replace(`\\b_`, `\\b_| {2,}\\n`)
      .replace(/\{2,\}/g, `*`)
      .getRegex(),
  },
  yo = { normal: Na, gfm: Fa, pedantic: Ia },
  bo = { normal: ho, gfm: _o, breaks: vo, pedantic: go },
  xo = { "&": `&amp;`, "<": `&lt;`, ">": `&gt;`, '"': `&quot;`, "'": `&#39;` },
  So = (e) => xo[e];
function Co(e, t) {
  if (t) {
    if (ma.escapeTest.test(e)) return e.replace(ma.escapeReplace, So);
  } else if (ma.escapeTestNoEncode.test(e))
    return e.replace(ma.escapeReplaceNoEncode, So);
  return e;
}
function wo(e) {
  try {
    e = encodeURI(e).replace(ma.percentDecode, `%`);
  } catch {
    return null;
  }
  return e;
}
function To(e, t) {
  let n = e
      .replace(ma.findPipe, (e, t, n) => {
        let r = !1,
          i = t;
        for (; --i >= 0 && n[i] === `\\`; ) r = !r;
        return r ? `|` : ` |`;
      })
      .split(ma.splitPipe),
    r = 0;
  if (
    (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t)
  )
    if (n.length > t) n.splice(t);
    else for (; n.length < t; ) n.push(``);
  for (; r < n.length; r++) n[r] = n[r].trim().replace(ma.slashPipe, `|`);
  return n;
}
function Eo(e, t, n) {
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
function Do(e) {
  let t = e.split(`
`),
    n = t.length - 1;
  for (; n >= 0 && ma.blankLine.test(t[n]); ) n--;
  return t.length - n <= 2
    ? e
    : t.slice(0, n + 1).join(`
`);
}
function Oo(e, t) {
  if (e.indexOf(t[1]) === -1) return -1;
  let n = 0;
  for (let r = 0; r < e.length; r++)
    if (e[r] === `\\`) r++;
    else if (e[r] === t[0]) n++;
    else if (e[r] === t[1] && (n--, n < 0)) return r;
  return n > 0 ? -2 : -1;
}
function ko(e, t = 0) {
  let n = t,
    r = ``;
  for (let t of e)
    if (t === `	`) {
      let e = 4 - (n % 4);
      ((r += ` `.repeat(e)), (n += e));
    } else ((r += t), n++);
  return r;
}
function Ao(e, t, n, r, i) {
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
function jo(e, t, n) {
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
var Mo = class {
    options;
    rules;
    lexer;
    constructor(e) {
      this.options = e || la;
    }
    space(e) {
      let t = this.rules.block.newline.exec(e);
      if (t && t[0].length > 0) return { type: `space`, raw: t[0] };
    }
    code(e) {
      let t = this.rules.block.code.exec(e);
      if (t) {
        let e = this.options.pedantic ? t[0] : Do(t[0]);
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
          n = jo(e, t[3] || ``, this.rules);
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
          let t = Eo(e, `#`);
          (this.options.pedantic ||
            !t ||
            this.rules.other.endingSpaceChar.test(t)) &&
            (e = t.trim());
        }
        return {
          type: `heading`,
          raw: Eo(
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
          raw: Eo(
            t[0],
            `
`,
          ),
        };
    }
    blockquote(e) {
      let t = this.rules.block.blockquote.exec(e);
      if (t) {
        let e = Eo(
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
          let c = ko(
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
                  ? ((l = l.replace(this.rules.other.listReplaceNesting, `  `)),
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
              (t.text = t.text.replace(this.rules.other.listReplaceTask, ``)));
            for (let e = this.lexer.inlineQueue.length - 1; e >= 0; e--)
              if (
                this.rules.other.listIsTask.test(this.lexer.inlineQueue[e].src)
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
            for (let t of e.tokens) t.type === `text` && (t.type = `paragraph`);
          }
        return i;
      }
    }
    html(e) {
      let t = this.rules.block.html.exec(e);
      if (t) {
        let e = Do(t[0]);
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
          raw: Eo(
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
      let n = To(t[1]),
        r = t[2].replace(this.rules.other.tableAlignChars, ``).split(`|`),
        i = t[3]?.trim()
          ? t[3].replace(this.rules.other.tableRowBlankLine, ``).split(`
`)
          : [],
        a = {
          type: `table`,
          raw: Eo(
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
            To(e, a.header.length).map((e, t) => ({
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
          raw: Eo(
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
          let t = Eo(e.slice(0, -1), `\\`);
          if ((e.length - t.length) % 2 == 0) return;
        } else {
          let e = Oo(t[2], `()`);
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
              this.options.pedantic && !this.rules.other.endAngleBracket.test(e)
                ? n.slice(1)
                : n.slice(1, -1)),
          Ao(
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
        return Ao(n, e, n[0], this.lexer, this.rules);
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
  No = class e {
    tokens;
    options;
    state;
    inlineQueue;
    tokenizer;
    constructor(e) {
      ((this.tokens = []),
        (this.tokens.links = Object.create(null)),
        (this.options = e || la),
        (this.options.tokenizer = this.options.tokenizer || new Mo()),
        (this.tokenizer = this.options.tokenizer),
        (this.tokenizer.options = this.options),
        (this.tokenizer.lexer = this),
        (this.inlineQueue = []),
        (this.state = { inLink: !1, inRawBlock: !1, top: !0 }));
      let t = { other: ma, block: yo.normal, inline: bo.normal };
      (this.options.pedantic
        ? ((t.block = yo.pedantic), (t.inline = bo.pedantic))
        : this.options.gfm &&
          ((t.block = yo.gfm),
          this.options.breaks ? (t.inline = bo.breaks) : (t.inline = bo.gfm)),
        (this.tokenizer.rules = t));
    }
    static get rules() {
      return { block: yo, inline: bo };
    }
    static lex(t, n) {
      return new e(n).lex(t);
    }
    static lexInline(t, n) {
      return new e(n).inlineTokens(t);
    }
    lex(e) {
      ((e = e.replace(
        ma.carriageReturn,
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
          (e = e.replace(ma.tabCharGlobal, `    `).replace(ma.spaceLine, ``)));
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
  Po = class {
    options;
    parser;
    constructor(e) {
      this.options = e || la;
    }
    space(e) {
      return ``;
    }
    code({ text: e, lang: t, escaped: n }) {
      let r = (t || ``).match(ma.notSpaceStart)?.[0],
        i =
          e.replace(ma.endingNewline, ``) +
          `
`;
      return r
        ? `<pre><code class="language-` +
            Co(r) +
            `">` +
            (n ? i : Co(i, !0)) +
            `</code></pre>
`
        : `<pre><code>` +
            (n ? i : Co(i, !0)) +
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
      return `<code>${Co(e, !0)}</code>`;
    }
    br(e) {
      return `<br>`;
    }
    del({ tokens: e }) {
      return `<del>${this.parser.parseInline(e)}</del>`;
    }
    link({ href: e, title: t, tokens: n }) {
      let r = this.parser.parseInline(n),
        i = wo(e);
      if (i === null) return r;
      e = i;
      let a = `<a href="` + e + `"`;
      return (t && (a += ` title="` + Co(t) + `"`), (a += `>` + r + `</a>`), a);
    }
    image({ href: e, title: t, text: n, tokens: r }) {
      r && (n = this.parser.parseInline(r, this.parser.textRenderer));
      let i = wo(e);
      if (i === null) return Co(n);
      e = i;
      let a = `<img src="${e}" alt="${Co(n)}"`;
      return (t && (a += ` title="${Co(t)}"`), (a += `>`), a);
    }
    text(e) {
      return `tokens` in e && e.tokens
        ? this.parser.parseInline(e.tokens)
        : `escaped` in e && e.escaped
          ? e.text
          : Co(e.text);
    }
  },
  Fo = class {
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
  Io = class e {
    options;
    renderer;
    textRenderer;
    constructor(e) {
      ((this.options = e || la),
        (this.options.renderer = this.options.renderer || new Po()),
        (this.renderer = this.options.renderer),
        (this.renderer.options = this.options),
        (this.renderer.parser = this),
        (this.textRenderer = new Fo()));
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
  Lo = class {
    options;
    block;
    constructor(e) {
      this.options = e || la;
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
      return e ? No.lex : No.lexInline;
    }
    provideParser(e = this.block) {
      return e ? Io.parse : Io.parseInline;
    }
  },
  Ro = new (class {
    defaults = ca();
    options = this.setOptions;
    parse = this.parseMarkdown(!0);
    parseInline = this.parseMarkdown(!1);
    Parser = Io;
    Renderer = Po;
    TextRenderer = Fo;
    Lexer = No;
    Tokenizer = Mo;
    Hooks = Lo;
    constructor(...e) {
      this.use(...e);
    }
    walkTokens(e, t) {
      let n = [];
      for (let r of e)
        switch (((n = n.concat(t.call(this, r))), r.type)) {
          case `table`: {
            let e = r;
            for (let r of e.header) n = n.concat(this.walkTokens(r.tokens, t));
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
                  if (!e.level || (e.level !== `block` && e.level !== `inline`))
                    throw Error(`extension level must be 'block' or 'inline'`);
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
            let t = this.defaults.renderer || new Po(this.defaults);
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
            let t = this.defaults.tokenizer || new Mo(this.defaults);
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
            let t = this.defaults.hooks || new Lo();
            for (let n in e.hooks) {
              if (!(n in t)) throw Error(`hook '${n}' does not exist`);
              if ([`options`, `block`].includes(n)) continue;
              let r = n,
                i = e.hooks[r],
                a = t[r];
              Lo.passThroughHooks.has(n)
                ? (t[r] = (e) => {
                    if (
                      this.defaults.async &&
                      Lo.passThroughHooksRespectAsync.has(n)
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
      return No.lex(e, t ?? this.defaults);
    }
    parser(e, t) {
      return Io.parse(e, t ?? this.defaults);
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
        if ((i.hooks && ((i.hooks.options = i), (i.hooks.block = e)), i.async))
          return (async () => {
            let n = i.hooks ? await i.hooks.preprocess(t) : t,
              r = await (
                i.hooks
                  ? await i.hooks.provideLexer(e)
                  : e
                    ? No.lex
                    : No.lexInline
              )(n, i),
              a = i.hooks ? await i.hooks.processAllTokens(r) : r;
            i.walkTokens &&
              (await Promise.all(this.walkTokens(a, i.walkTokens)));
            let o = await (
              i.hooks
                ? await i.hooks.provideParser(e)
                : e
                  ? Io.parse
                  : Io.parseInline
            )(a, i);
            return i.hooks ? await i.hooks.postprocess(o) : o;
          })().catch(a);
        try {
          i.hooks && (t = i.hooks.preprocess(t));
          let n = (
            i.hooks ? i.hooks.provideLexer(e) : e ? No.lex : No.lexInline
          )(t, i);
          (i.hooks && (n = i.hooks.processAllTokens(n)),
            i.walkTokens && this.walkTokens(n, i.walkTokens));
          let r = (
            i.hooks ? i.hooks.provideParser(e) : e ? Io.parse : Io.parseInline
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
            Co(n.message + ``, !0) +
            `</pre>`;
          return t ? Promise.resolve(e) : e;
        }
        if (t) return Promise.reject(n);
        throw n;
      };
    }
  })();
function Q(e, t) {
  return Ro.parse(e, t);
}
((Q.options = Q.setOptions =
  function (e) {
    return (Ro.setOptions(e), (Q.defaults = Ro.defaults), ua(Q.defaults), Q);
  }),
  (Q.getDefaults = ca),
  (Q.defaults = la),
  (Q.use = function (...e) {
    return (Ro.use(...e), (Q.defaults = Ro.defaults), ua(Q.defaults), Q);
  }),
  (Q.walkTokens = function (e, t) {
    return Ro.walkTokens(e, t);
  }),
  (Q.parseInline = Ro.parseInline),
  (Q.Parser = Io),
  (Q.parser = Io.parse),
  (Q.Renderer = Po),
  (Q.TextRenderer = Fo),
  (Q.Lexer = No),
  (Q.lexer = No.lex),
  (Q.Tokenizer = Mo),
  (Q.Hooks = Lo),
  (Q.parse = Q),
  Q.options,
  Q.setOptions,
  Q.use,
  Q.walkTokens,
  Q.parseInline,
  Io.parse,
  No.lex);
function zo(e, t) {
  (t == null || t > e.length) && (t = e.length);
  for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
  return r;
}
function Bo(e) {
  if (Array.isArray(e)) return e;
}
function Vo(e, t) {
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
function Ho() {
  throw TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Uo(e, t) {
  return Bo(e) || Vo(e, t) || Wo(e, t) || Ho();
}
function Wo(e, t) {
  if (e) {
    if (typeof e == `string`) return zo(e, t);
    var n = {}.toString.call(e).slice(8, -1);
    return (
      n === `Object` && e.constructor && (n = e.constructor.name),
      n === `Map` || n === `Set`
        ? Array.from(e)
        : n === `Arguments` ||
            /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
          ? zo(e, t)
          : void 0
    );
  }
}
var Go = Object.entries,
  Ko = Object.setPrototypeOf,
  qo = Object.isFrozen,
  Jo = Object.getPrototypeOf,
  Yo = Object.getOwnPropertyDescriptor,
  Xo = Object.freeze,
  Zo = Object.seal,
  Qo = Object.create,
  $o = typeof Reflect < `u` && Reflect,
  es = $o.apply,
  ts = $o.construct;
((Xo ||= function (e) {
  return e;
}),
  (Zo ||= function (e) {
    return e;
  }),
  (es ||= function (e, t) {
    var n = [...arguments].slice(2);
    return e.apply(t, n);
  }),
  (ts ||= function (e) {
    return new e(...[...arguments].slice(1));
  }));
var ns = Ss(Array.prototype.forEach),
  rs = Ss(Array.prototype.lastIndexOf),
  is = Ss(Array.prototype.pop),
  as = Ss(Array.prototype.push),
  os = Ss(Array.prototype.splice),
  ss = Array.isArray,
  cs = Ss(String.prototype.toLowerCase),
  ls = Ss(String.prototype.toString),
  us = Ss(String.prototype.match),
  ds = Ss(String.prototype.replace),
  fs = Ss(String.prototype.indexOf),
  ps = Ss(String.prototype.trim),
  ms = Ss(Number.prototype.toString),
  hs = Ss(Boolean.prototype.toString),
  gs = typeof BigInt > `u` ? null : Ss(BigInt.prototype.toString),
  _s = typeof Symbol > `u` ? null : Ss(Symbol.prototype.toString),
  vs = Ss(Object.prototype.hasOwnProperty),
  ys = Ss(Object.prototype.toString),
  bs = Ss(RegExp.prototype.test),
  xs = Cs(TypeError);
function Ss(e) {
  return function (t) {
    t instanceof RegExp && (t.lastIndex = 0);
    var n = [...arguments].slice(1);
    return es(e, t, n);
  };
}
function Cs(e) {
  return function () {
    return ts(e, [...arguments]);
  };
}
function $(e, t) {
  let n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : cs;
  if ((Ko && Ko(e, null), !ss(t))) return e;
  let r = t.length;
  for (; r--; ) {
    let i = t[r];
    if (typeof i == `string`) {
      let e = n(i);
      e !== i && (qo(t) || (t[r] = e), (i = e));
    }
    e[i] = !0;
  }
  return e;
}
function ws(e) {
  for (let t = 0; t < e.length; t++) vs(e, t) || (e[t] = null);
  return e;
}
function Ts(e) {
  let t = Qo(null);
  for (let r of Go(e)) {
    var n = Uo(r, 2);
    let i = n[0],
      a = n[1];
    vs(e, i) &&
      (ss(a)
        ? (t[i] = ws(a))
        : a && typeof a == `object` && a.constructor === Object
          ? (t[i] = Ts(a))
          : (t[i] = a));
  }
  return t;
}
function Es(e) {
  switch (typeof e) {
    case `string`:
      return e;
    case `number`:
      return ms(e);
    case `boolean`:
      return hs(e);
    case `bigint`:
      return gs ? gs(e) : `0`;
    case `symbol`:
      return _s ? _s(e) : `Symbol()`;
    case `undefined`:
      return ys(e);
    case `function`:
    case `object`: {
      if (e === null) return ys(e);
      let t = e,
        n = Ds(t, `toString`);
      if (typeof n == `function`) {
        let e = n(t);
        return typeof e == `string` ? e : ys(e);
      }
      return ys(e);
    }
    default:
      return ys(e);
  }
}
function Ds(e, t) {
  for (; e !== null; ) {
    let n = Yo(e, t);
    if (n) {
      if (n.get) return Ss(n.get);
      if (typeof n.value == `function`) return Ss(n.value);
    }
    e = Jo(e);
  }
  function n() {
    return null;
  }
  return n;
}
function Os(e) {
  try {
    return (bs(e, ``), !0);
  } catch {
    return !1;
  }
}
var ks = Xo(
    `a.abbr.acronym.address.area.article.aside.audio.b.bdi.bdo.big.blink.blockquote.body.br.button.canvas.caption.center.cite.code.col.colgroup.content.data.datalist.dd.decorator.del.details.dfn.dialog.dir.div.dl.dt.element.em.fieldset.figcaption.figure.font.footer.form.h1.h2.h3.h4.h5.h6.head.header.hgroup.hr.html.i.img.input.ins.kbd.label.legend.li.main.map.mark.marquee.menu.menuitem.meter.nav.nobr.ol.optgroup.option.output.p.picture.pre.progress.q.rp.rt.ruby.s.samp.search.section.select.shadow.slot.small.source.spacer.span.strike.strong.style.sub.summary.sup.table.tbody.td.template.textarea.tfoot.th.thead.time.tr.track.tt.u.ul.var.video.wbr`.split(
      `.`,
    ),
  ),
  As = Xo(
    `svg.a.altglyph.altglyphdef.altglyphitem.animatecolor.animatemotion.animatetransform.circle.clippath.defs.desc.ellipse.enterkeyhint.exportparts.filter.font.g.glyph.glyphref.hkern.image.inputmode.line.lineargradient.marker.mask.metadata.mpath.part.path.pattern.polygon.polyline.radialgradient.rect.stop.style.switch.symbol.text.textpath.title.tref.tspan.view.vkern`.split(
      `.`,
    ),
  ),
  js = Xo([
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
  Ms = Xo([
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
  Ns = Xo(
    `math.menclose.merror.mfenced.mfrac.mglyph.mi.mlabeledtr.mmultiscripts.mn.mo.mover.mpadded.mphantom.mroot.mrow.ms.mspace.msqrt.mstyle.msub.msup.msubsup.mtable.mtd.mtext.mtr.munder.munderover.mprescripts`.split(
      `.`,
    ),
  ),
  Ps = Xo([
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
  Fs = Xo([`#text`]),
  Is = Xo(
    `accept.action.align.alt.autocapitalize.autocomplete.autopictureinpicture.autoplay.background.bgcolor.border.capture.cellpadding.cellspacing.checked.cite.class.clear.color.cols.colspan.command.commandfor.controls.controlslist.coords.crossorigin.datetime.decoding.default.dir.disabled.disablepictureinpicture.disableremoteplayback.download.draggable.enctype.enterkeyhint.exportparts.face.for.headers.height.hidden.high.href.hreflang.id.inert.inputmode.integrity.ismap.kind.label.lang.list.loading.loop.low.max.maxlength.media.method.min.minlength.multiple.muted.name.nonce.noshade.novalidate.nowrap.open.optimum.part.pattern.placeholder.playsinline.popover.popovertarget.popovertargetaction.poster.preload.pubdate.radiogroup.readonly.rel.required.rev.reversed.role.rows.rowspan.spellcheck.scope.selected.shape.size.sizes.slot.span.srclang.start.src.srcset.step.style.summary.tabindex.title.translate.type.usemap.valign.value.width.wrap.xmlns`.split(
      `.`,
    ),
  ),
  Ls = Xo(
    `accent-height.accumulate.additive.alignment-baseline.amplitude.ascent.attributename.attributetype.azimuth.basefrequency.baseline-shift.begin.bias.by.class.clip.clippathunits.clip-path.clip-rule.color.color-interpolation.color-interpolation-filters.color-profile.color-rendering.cx.cy.d.dx.dy.diffuseconstant.direction.display.divisor.dur.edgemode.elevation.end.exponent.fill.fill-opacity.fill-rule.filter.filterunits.flood-color.flood-opacity.font-family.font-size.font-size-adjust.font-stretch.font-style.font-variant.font-weight.fx.fy.g1.g2.glyph-name.glyphref.gradientunits.gradienttransform.height.href.id.image-rendering.in.in2.intercept.k.k1.k2.k3.k4.kerning.keypoints.keysplines.keytimes.lang.lengthadjust.letter-spacing.kernelmatrix.kernelunitlength.lighting-color.local.marker-end.marker-mid.marker-start.markerheight.markerunits.markerwidth.maskcontentunits.maskunits.max.mask.mask-type.media.method.mode.min.name.numoctaves.offset.operator.opacity.order.orient.orientation.origin.overflow.paint-order.path.pathlength.patterncontentunits.patterntransform.patternunits.points.preservealpha.preserveaspectratio.primitiveunits.r.rx.ry.radius.refx.refy.repeatcount.repeatdur.restart.result.rotate.scale.seed.shape-rendering.slope.specularconstant.specularexponent.spreadmethod.startoffset.stddeviation.stitchtiles.stop-color.stop-opacity.stroke-dasharray.stroke-dashoffset.stroke-linecap.stroke-linejoin.stroke-miterlimit.stroke-opacity.stroke.stroke-width.style.surfacescale.systemlanguage.tabindex.tablevalues.targetx.targety.transform.transform-origin.text-anchor.text-decoration.text-rendering.textlength.type.u1.u2.unicode.values.viewbox.visibility.version.vert-adv-y.vert-origin-x.vert-origin-y.width.word-spacing.wrap.writing-mode.xchannelselector.ychannelselector.x.x1.x2.xmlns.y.y1.y2.z.zoomandpan`.split(
      `.`,
    ),
  ),
  Rs = Xo(
    `accent.accentunder.align.bevelled.close.columnalign.columnlines.columnspacing.columnspan.denomalign.depth.dir.display.displaystyle.encoding.fence.frame.height.href.id.largeop.length.linethickness.lquote.lspace.mathbackground.mathcolor.mathsize.mathvariant.maxsize.minsize.movablelimits.notation.numalign.open.rowalign.rowlines.rowspacing.rowspan.rspace.rquote.scriptlevel.scriptminsize.scriptsizemultiplier.selection.separator.separators.stretchy.subscriptshift.supscriptshift.symmetric.voffset.width.xmlns`.split(
      `.`,
    ),
  ),
  zs = Xo([`xlink:href`, `xml:id`, `xlink:title`, `xml:space`, `xmlns:xlink`]),
  Bs = Zo(/{{[\w\W]*|^[\w\W]*}}/g),
  Vs = Zo(/<%[\w\W]*|^[\w\W]*%>/g),
  Hs = Zo(/\${[\w\W]*/g),
  Us = Zo(/^data-[\-\w.\u00B7-\uFFFF]+$/),
  Ws = Zo(/^aria-[\-\w]+$/),
  Gs = Zo(
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ),
  Ks = Zo(/^(?:\w+script|data):/i),
  qs = Zo(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),
  Js = Zo(/^html$/i),
  Ys = Zo(/^[a-z][.\w]*(-[.\w]+)+$/i),
  Xs = {
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
  Zs = function () {
    return typeof window > `u` ? null : window;
  },
  Qs = function (e, t) {
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
  $s = function () {
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
function ec() {
  let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Zs(),
    t = (e) => ec(e);
  if (
    ((t.version = `3.4.9`),
    (t.removed = []),
    !e || !e.document || e.document.nodeType !== Xs.document || !e.Element)
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
    f = Ds(d, `cloneNode`),
    p = Ds(d, `remove`),
    m = Ds(d, `nextSibling`),
    h = Ds(d, `childNodes`),
    g = Ds(d, `parentNode`),
    _ = Ds(d, `shadowRoot`),
    v = Ds(d, `attributes`),
    y = o && o.prototype ? Ds(o.prototype, `nodeType`) : null,
    b = o && o.prototype ? Ds(o.prototype, `nodeName`) : null;
  if (typeof a == `function`) {
    let e = n.createElement(`template`);
    e.content && e.content.ownerDocument && (n = e.content.ownerDocument);
  }
  let x,
    S = ``,
    C,
    w = !1,
    T = 0,
    ee = function () {
      if (T > 0)
        throw xs(
          `A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.`,
        );
    },
    E = function (e) {
      (ee(), T++);
      try {
        return x.createHTML(e);
      } finally {
        T--;
      }
    },
    te = function (e) {
      (ee(), T++);
      try {
        return x.createScriptURL(e);
      } finally {
        T--;
      }
    },
    D = function () {
      return ((w ||= ((C = Qs(u, i)), !0)), C);
    },
    ne = n,
    re = ne.implementation,
    ie = ne.createNodeIterator,
    ae = ne.createDocumentFragment,
    oe = ne.getElementsByTagName,
    se = r.importNode,
    O = $s();
  t.isSupported =
    typeof Go == `function` &&
    typeof g == `function` &&
    re &&
    re.createHTMLDocument !== void 0;
  let ce = Bs,
    le = Vs,
    ue = Hs,
    de = Us,
    fe = Ws,
    pe = Ks,
    me = qs,
    he = Ys,
    ge = Gs,
    _e = null,
    ve = $({}, [...ks, ...As, ...js, ...Ns, ...Fs]),
    k = null,
    ye = $({}, [...Is, ...Ls, ...Rs, ...zs]),
    be = Object.seal(
      Qo(null, {
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
    xe = null,
    Se = null,
    Ce = Object.seal(
      Qo(null, {
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
    we = !0,
    Te = !0,
    Ee = !1,
    De = !0,
    Oe = !1,
    ke = !0,
    Ae = !1,
    je = !1,
    A = !1,
    Me = !1,
    j = !1,
    Ne = !1,
    Pe = !0,
    M = !1,
    Fe = `user-content-`,
    Ie = !0,
    Le = !1,
    Re = {},
    ze = null,
    Be = $(
      {},
      `annotation-xml.audio.colgroup.desc.foreignobject.head.iframe.math.mi.mn.mo.ms.mtext.noembed.noframes.noscript.plaintext.script.selectedcontent.style.svg.template.thead.title.video.xmp`.split(
        `.`,
      ),
    ),
    Ve = null,
    He = $({}, [`audio`, `video`, `img`, `source`, `image`, `track`]),
    N = null,
    Ue = $({}, [
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
    Xe = $({}, [We, Ge, Ke], ls),
    Ze = $({}, [`mi`, `mo`, `mn`, `ms`, `mtext`]),
    Qe = $({}, [`annotation-xml`]),
    $e = $({}, [`title`, `style`, `font`, `a`, `script`]),
    P = null,
    et = [`application/xhtml+xml`, `text/html`],
    tt = null,
    nt = null,
    rt = n.createElement(`form`),
    it = function (e) {
      return e instanceof RegExp || e instanceof Function;
    },
    at = function () {
      let e =
        arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
      if (nt && nt === e) return;
      ((!e || typeof e != `object`) && (e = {}),
        (e = Ts(e)),
        (P =
          et.indexOf(e.PARSER_MEDIA_TYPE) === -1
            ? `text/html`
            : e.PARSER_MEDIA_TYPE),
        (tt = P === `application/xhtml+xml` ? ls : cs),
        (_e =
          vs(e, `ALLOWED_TAGS`) && ss(e.ALLOWED_TAGS)
            ? $({}, e.ALLOWED_TAGS, tt)
            : ve),
        (k =
          vs(e, `ALLOWED_ATTR`) && ss(e.ALLOWED_ATTR)
            ? $({}, e.ALLOWED_ATTR, tt)
            : ye),
        (Ye =
          vs(e, `ALLOWED_NAMESPACES`) && ss(e.ALLOWED_NAMESPACES)
            ? $({}, e.ALLOWED_NAMESPACES, ls)
            : Xe),
        (N =
          vs(e, `ADD_URI_SAFE_ATTR`) && ss(e.ADD_URI_SAFE_ATTR)
            ? $(Ts(Ue), e.ADD_URI_SAFE_ATTR, tt)
            : Ue),
        (Ve =
          vs(e, `ADD_DATA_URI_TAGS`) && ss(e.ADD_DATA_URI_TAGS)
            ? $(Ts(He), e.ADD_DATA_URI_TAGS, tt)
            : He),
        (ze =
          vs(e, `FORBID_CONTENTS`) && ss(e.FORBID_CONTENTS)
            ? $({}, e.FORBID_CONTENTS, tt)
            : Be),
        (xe =
          vs(e, `FORBID_TAGS`) && ss(e.FORBID_TAGS)
            ? $({}, e.FORBID_TAGS, tt)
            : Ts({})),
        (Se =
          vs(e, `FORBID_ATTR`) && ss(e.FORBID_ATTR)
            ? $({}, e.FORBID_ATTR, tt)
            : Ts({})),
        (Re = vs(e, `USE_PROFILES`)
          ? e.USE_PROFILES && typeof e.USE_PROFILES == `object`
            ? Ts(e.USE_PROFILES)
            : e.USE_PROFILES
          : !1),
        (we = e.ALLOW_ARIA_ATTR !== !1),
        (Te = e.ALLOW_DATA_ATTR !== !1),
        (Ee = e.ALLOW_UNKNOWN_PROTOCOLS || !1),
        (De = e.ALLOW_SELF_CLOSE_IN_ATTR !== !1),
        (Oe = e.SAFE_FOR_TEMPLATES || !1),
        (ke = e.SAFE_FOR_XML !== !1),
        (Ae = e.WHOLE_DOCUMENT || !1),
        (Me = e.RETURN_DOM || !1),
        (j = e.RETURN_DOM_FRAGMENT || !1),
        (Ne = e.RETURN_TRUSTED_TYPE || !1),
        (A = e.FORCE_BODY || !1),
        (Pe = e.SANITIZE_DOM !== !1),
        (M = e.SANITIZE_NAMED_PROPS || !1),
        (Ie = e.KEEP_CONTENT !== !1),
        (Le = e.IN_PLACE || !1),
        (ge = Os(e.ALLOWED_URI_REGEXP) ? e.ALLOWED_URI_REGEXP : Gs),
        (qe = typeof e.NAMESPACE == `string` ? e.NAMESPACE : Ke),
        (Ze =
          vs(e, `MATHML_TEXT_INTEGRATION_POINTS`) &&
          e.MATHML_TEXT_INTEGRATION_POINTS &&
          typeof e.MATHML_TEXT_INTEGRATION_POINTS == `object`
            ? Ts(e.MATHML_TEXT_INTEGRATION_POINTS)
            : $({}, [`mi`, `mo`, `mn`, `ms`, `mtext`])),
        (Qe =
          vs(e, `HTML_INTEGRATION_POINTS`) &&
          e.HTML_INTEGRATION_POINTS &&
          typeof e.HTML_INTEGRATION_POINTS == `object`
            ? Ts(e.HTML_INTEGRATION_POINTS)
            : $({}, [`annotation-xml`])));
      let t =
        vs(e, `CUSTOM_ELEMENT_HANDLING`) &&
        e.CUSTOM_ELEMENT_HANDLING &&
        typeof e.CUSTOM_ELEMENT_HANDLING == `object`
          ? Ts(e.CUSTOM_ELEMENT_HANDLING)
          : Qo(null);
      if (
        ((be = Qo(null)),
        vs(t, `tagNameCheck`) &&
          it(t.tagNameCheck) &&
          (be.tagNameCheck = t.tagNameCheck),
        vs(t, `attributeNameCheck`) &&
          it(t.attributeNameCheck) &&
          (be.attributeNameCheck = t.attributeNameCheck),
        vs(t, `allowCustomizedBuiltInElements`) &&
          typeof t.allowCustomizedBuiltInElements == `boolean` &&
          (be.allowCustomizedBuiltInElements =
            t.allowCustomizedBuiltInElements),
        Oe && (Te = !1),
        j && (Me = !0),
        Re &&
          ((_e = $({}, Fs)),
          (k = Qo(null)),
          Re.html === !0 && ($(_e, ks), $(k, Is)),
          Re.svg === !0 && ($(_e, As), $(k, Ls), $(k, zs)),
          Re.svgFilters === !0 && ($(_e, js), $(k, Ls), $(k, zs)),
          Re.mathMl === !0 && ($(_e, Ns), $(k, Rs), $(k, zs))),
        (Ce.tagCheck = null),
        (Ce.attributeCheck = null),
        vs(e, `ADD_TAGS`) &&
          (typeof e.ADD_TAGS == `function`
            ? (Ce.tagCheck = e.ADD_TAGS)
            : ss(e.ADD_TAGS) &&
              (_e === ve && (_e = Ts(_e)), $(_e, e.ADD_TAGS, tt))),
        vs(e, `ADD_ATTR`) &&
          (typeof e.ADD_ATTR == `function`
            ? (Ce.attributeCheck = e.ADD_ATTR)
            : ss(e.ADD_ATTR) &&
              (k === ye && (k = Ts(k)), $(k, e.ADD_ATTR, tt))),
        vs(e, `ADD_URI_SAFE_ATTR`) &&
          ss(e.ADD_URI_SAFE_ATTR) &&
          $(N, e.ADD_URI_SAFE_ATTR, tt),
        vs(e, `FORBID_CONTENTS`) &&
          ss(e.FORBID_CONTENTS) &&
          (ze === Be && (ze = Ts(ze)), $(ze, e.FORBID_CONTENTS, tt)),
        vs(e, `ADD_FORBID_CONTENTS`) &&
          ss(e.ADD_FORBID_CONTENTS) &&
          (ze === Be && (ze = Ts(ze)), $(ze, e.ADD_FORBID_CONTENTS, tt)),
        Ie && (_e[`#text`] = !0),
        Ae && $(_e, [`html`, `head`, `body`]),
        _e.table && ($(_e, [`tbody`]), delete xe.tbody),
        e.TRUSTED_TYPES_POLICY)
      ) {
        if (typeof e.TRUSTED_TYPES_POLICY.createHTML != `function`)
          throw xs(
            `TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.`,
          );
        if (typeof e.TRUSTED_TYPES_POLICY.createScriptURL != `function`)
          throw xs(
            `TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.`,
          );
        let t = x;
        x = e.TRUSTED_TYPES_POLICY;
        try {
          S = E(``);
        } catch (e) {
          throw ((x = t), e);
        }
      } else
        e.TRUSTED_TYPES_POLICY === null
          ? ((x = void 0), (S = ``))
          : (x === void 0 && (x = D()),
            x && typeof S == `string` && (S = E(``)));
      ((O.uponSanitizeElement.length > 0 ||
        O.uponSanitizeAttribute.length > 0) &&
        _e === ve &&
        (_e = Ts(_e)),
        O.uponSanitizeAttribute.length > 0 && k === ye && (k = Ts(k)),
        Xo && Xo(e),
        (nt = e));
    },
    ot = $({}, [...As, ...js, ...Ms]),
    st = $({}, [...Ns, ...Ps]),
    ct = function (e) {
      let t = g(e);
      (!t || !t.tagName) && (t = { namespaceURI: qe, tagName: `template` });
      let n = cs(e.tagName),
        r = cs(t.tagName);
      return Ye[e.namespaceURI]
        ? e.namespaceURI === Ge
          ? t.namespaceURI === Ke
            ? n === `svg`
            : t.namespaceURI === We
              ? n === `svg` && (r === `annotation-xml` || Ze[r])
              : !!ot[n]
          : e.namespaceURI === We
            ? t.namespaceURI === Ke
              ? n === `math`
              : t.namespaceURI === Ge
                ? n === `math` && Qe[r]
                : !!st[n]
            : e.namespaceURI === Ke
              ? (t.namespaceURI === Ge && !Qe[r]) ||
                (t.namespaceURI === We && !Ze[r])
                ? !1
                : !st[n] && ($e[n] || !ot[n])
              : !!(P === `application/xhtml+xml` && Ye[e.namespaceURI])
        : !1;
    },
    lt = function (e) {
      as(t.removed, { element: e });
      try {
        g(e).removeChild(e);
      } catch {
        if ((p(e), !g(e)))
          throw xs(
            `a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place`,
          );
      }
    },
    ut = function (e) {
      let t = h ? h(e) : e.childNodes;
      if (t) {
        let e = [];
        (ns(t, (t) => {
          as(e, t);
        }),
          ns(e, (e) => {
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
    dt = function (e, n) {
      try {
        as(t.removed, { attribute: n.getAttributeNode(e), from: n });
      } catch {
        as(t.removed, { attribute: null, from: n });
      }
      if ((n.removeAttribute(e), e === `is`))
        if (Me || j)
          try {
            lt(n);
          } catch {}
        else
          try {
            n.setAttribute(e, ``);
          } catch {}
    },
    ft = function (e) {
      let t = v ? v(e) : e.attributes;
      if (t)
        for (let n = t.length - 1; n >= 0; --n) {
          let r = t[n],
            i = r && r.name;
          if (!(typeof i != `string` || k[tt(i)]))
            try {
              e.removeAttribute(i);
            } catch {}
        }
    },
    pt = function (e) {
      let t = [e];
      for (; t.length > 0; ) {
        let e = t.pop();
        (y ? y(e) : e.nodeType) === Xs.element && ft(e);
        let n = h ? h(e) : e.childNodes;
        if (n) for (let e = n.length - 1; e >= 0; --e) t.push(n[e]);
      }
    },
    mt = function (e) {
      let t = null,
        r = null;
      if (A) e = `<remove></remove>` + e;
      else {
        let t = us(e, /^[\r\n\t ]+/);
        r = t && t[0];
      }
      P === `application/xhtml+xml` &&
        qe === Ke &&
        (e =
          `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>` +
          e +
          `</body></html>`);
      let i = x ? E(e) : e;
      if (qe === Ke)
        try {
          t = new l().parseFromString(i, P);
        } catch {}
      if (!t || !t.documentElement) {
        t = re.createDocument(qe, `template`, null);
        try {
          t.documentElement.innerHTML = Je ? S : i;
        } catch {}
      }
      let a = t.body || t.documentElement;
      return (
        e && r && a.insertBefore(n.createTextNode(r), a.childNodes[0] || null),
        qe === Ke
          ? oe.call(t, Ae ? `html` : `body`)[0]
          : Ae
            ? t.documentElement
            : a
      );
    },
    ht = function (e) {
      return ie.call(
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
    gt = function (e) {
      e.normalize();
      let t = ie.call(
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
        (ns([ce, le, ue], (t) => {
          e = ds(e, t, ` `);
        }),
          (n.data = e),
          (n = t.nextNode()));
      }
      let r = e.querySelectorAll?.call(e, `template`) ?? [];
      ns(Array.from(r), (e) => {
        _t(e.content) && gt(e.content);
      });
    },
    F = function (e) {
      let t = b ? b(e) : null;
      return typeof t != `string` || tt(t) !== `form`
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
        return y(e) === Xs.documentFragment;
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
    ns(e, (e) => {
      e.call(t, n, r, nt);
    });
  }
  let bt = function (e) {
      let n = null;
      if ((yt(O.beforeSanitizeElements, e, null), F(e))) return (lt(e), !0);
      let r = tt(b ? b(e) : e.nodeName);
      if (
        (yt(O.uponSanitizeElement, e, { tagName: r, allowedTags: _e }),
        (ke &&
          e.hasChildNodes() &&
          !vt(e.firstElementChild) &&
          bs(/<[/\w!]/g, e.innerHTML) &&
          bs(/<[/\w!]/g, e.textContent)) ||
          (ke &&
            e.namespaceURI === Ke &&
            r === `style` &&
            vt(e.firstElementChild)) ||
          e.nodeType === Xs.progressingInstruction ||
          (ke && e.nodeType === Xs.comment && bs(/<[/\w]/g, e.data)))
      )
        return (lt(e), !0);
      if (
        xe[r] ||
        (!(Ce.tagCheck instanceof Function && Ce.tagCheck(r)) && !_e[r])
      ) {
        if (
          !xe[r] &&
          Ct(r) &&
          ((be.tagNameCheck instanceof RegExp && bs(be.tagNameCheck, r)) ||
            (be.tagNameCheck instanceof Function && be.tagNameCheck(r)))
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
        return (lt(e), !0);
      }
      return ((y ? y(e) : e.nodeType) === Xs.element && !ct(e)) ||
        ((r === `noscript` || r === `noembed` || r === `noframes`) &&
          bs(/<\/no(script|embed|frames)/i, e.innerHTML))
        ? (lt(e), !0)
        : (Oe &&
            e.nodeType === Xs.text &&
            ((n = e.textContent),
            ns([ce, le, ue], (e) => {
              n = ds(n, e, ` `);
            }),
            e.textContent !== n &&
              (as(t.removed, { element: e.cloneNode() }), (e.textContent = n))),
          yt(O.afterSanitizeElements, e, null),
          !1);
    },
    xt = function (e, t, r) {
      if (Se[t] || (Pe && (t === `id` || t === `name`) && (r in n || r in rt)))
        return !1;
      let i =
        k[t] ||
        (Ce.attributeCheck instanceof Function && Ce.attributeCheck(t, e));
      if (!(Te && !Se[t] && bs(de, t)) && !(we && bs(fe, t))) {
        if (!i || Se[t]) {
          if (
            !(
              (Ct(e) &&
                ((be.tagNameCheck instanceof RegExp &&
                  bs(be.tagNameCheck, e)) ||
                  (be.tagNameCheck instanceof Function &&
                    be.tagNameCheck(e))) &&
                ((be.attributeNameCheck instanceof RegExp &&
                  bs(be.attributeNameCheck, t)) ||
                  (be.attributeNameCheck instanceof Function &&
                    be.attributeNameCheck(t, e)))) ||
              (t === `is` &&
                be.allowCustomizedBuiltInElements &&
                ((be.tagNameCheck instanceof RegExp &&
                  bs(be.tagNameCheck, r)) ||
                  (be.tagNameCheck instanceof Function && be.tagNameCheck(r))))
            )
          )
            return !1;
        } else if (
          !N[t] &&
          !bs(ge, ds(r, me, ``)) &&
          !(
            (t === `src` || t === `xlink:href` || t === `href`) &&
            e !== `script` &&
            fs(r, `data:`) === 0 &&
            Ve[e]
          ) &&
          !(Ee && !bs(pe, ds(r, me, ``))) &&
          r
        )
          return !1;
      }
      return !0;
    },
    St = $({}, [
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
      return !St[cs(e)] && bs(he, e);
    },
    wt = function (e) {
      yt(O.beforeSanitizeAttributes, e, null);
      let n = e.attributes;
      if (!n || F(e)) return;
      let r = {
          attrName: ``,
          attrValue: ``,
          keepAttr: !0,
          allowedAttributes: k,
          forceKeepAttr: void 0,
        },
        i = n.length;
      for (; i--; ) {
        let a = n[i],
          o = a.name,
          s = a.namespaceURI,
          c = a.value,
          l = tt(o),
          d = c,
          f = o === `value` ? d : ps(d);
        if (
          ((r.attrName = l),
          (r.attrValue = f),
          (r.keepAttr = !0),
          (r.forceKeepAttr = void 0),
          yt(O.uponSanitizeAttribute, e, r),
          (f = r.attrValue),
          M &&
            (l === `id` || l === `name`) &&
            fs(f, Fe) !== 0 &&
            (dt(o, e), (f = Fe + f)),
          ke &&
            bs(
              /((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,
              f,
            ))
        ) {
          dt(o, e);
          continue;
        }
        if (l === `attributename` && us(f, `href`)) {
          dt(o, e);
          continue;
        }
        if (r.forceKeepAttr) continue;
        if (!r.keepAttr) {
          dt(o, e);
          continue;
        }
        if (!De && bs(/\/>/i, f)) {
          dt(o, e);
          continue;
        }
        Oe &&
          ns([ce, le, ue], (e) => {
            f = ds(f, e, ` `);
          });
        let p = tt(e.nodeName);
        if (!xt(p, l, f)) {
          dt(o, e);
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
              f = E(f);
              break;
            case `TrustedScriptURL`:
              f = te(f);
              break;
          }
        if (f !== d)
          try {
            (s ? e.setAttributeNS(s, o, f) : e.setAttribute(o, f),
              F(e) ? lt(e) : is(t.removed));
          } catch {
            dt(o, e);
          }
      }
      yt(O.afterSanitizeAttributes, e, null);
    },
    I = function (e) {
      let t = null,
        n = ht(e);
      for (yt(O.beforeSanitizeShadowDOM, e, null); (t = n.nextNode()); )
        if (
          (yt(O.uponSanitizeShadowNode, t, null),
          bt(t),
          wt(t),
          _t(t.content) && I(t.content),
          (y ? y(t) : t.nodeType) === Xs.element)
        ) {
          let e = _ ? _(t) : t.shadowRoot;
          _t(e) && (Tt(e), I(e));
        }
      yt(O.afterSanitizeShadowDOM, e, null);
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
          r = (y ? y(n) : n.nodeType) === Xs.element,
          i = h ? h(n) : n.childNodes;
        if (i)
          for (let e = i.length - 1; e >= 0; --e)
            t.push({ node: i[e], shadow: null });
        if (r) {
          let e = b ? b(n) : null;
          if (typeof e == `string` && tt(e) === `template`) {
            let e = n.content;
            _t(e) && t.push({ node: e, shadow: null });
          }
        }
        if (r) {
          let e = _ ? _(n) : n.shadowRoot;
          _t(e) && t.push({ node: null, shadow: e }, { node: e, shadow: null });
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
        typeof e != `string` && !vt(e) && ((e = Es(e)), typeof e != `string`))
      )
        throw xs(`dirty is not a string, aborting`);
      if (!t.isSupported) return e;
      (je || at(n), (t.removed = []));
      let c = Le && typeof e != `string` && vt(e);
      if (c) {
        let t = b ? b(e) : e.nodeName;
        if (typeof t == `string`) {
          let e = tt(t);
          if (!_e[e] || xe[e])
            throw xs(`root node is forbidden and cannot be sanitized in-place`);
        }
        if (F(e))
          throw xs(`root node is clobbered and cannot be sanitized in-place`);
        try {
          Tt(e);
        } catch (t) {
          throw (ut(e), t);
        }
      } else if (vt(e))
        ((i = mt(`<!---->`)),
          (a = i.ownerDocument.importNode(e, !0)),
          (a.nodeType === Xs.element && a.nodeName === `BODY`) ||
          a.nodeName === `HTML`
            ? (i = a)
            : i.appendChild(a),
          Tt(a));
      else {
        if (!Me && !Oe && !Ae && e.indexOf(`<`) === -1)
          return x && Ne ? E(e) : e;
        if (((i = mt(e)), !i)) return Me ? null : Ne ? S : ``;
      }
      i && A && lt(i.firstChild);
      let l = ht(c ? e : i);
      try {
        for (; (o = l.nextNode()); )
          (bt(o), wt(o), _t(o.content) && I(o.content));
      } catch (t) {
        throw (c && ut(e), t);
      }
      if (c)
        return (
          ns(t.removed, (e) => {
            e.element && pt(e.element);
          }),
          Oe && gt(e),
          e
        );
      if (Me) {
        if ((Oe && gt(i), j))
          for (s = ae.call(i.ownerDocument); i.firstChild; )
            s.appendChild(i.firstChild);
        else s = i;
        return (
          (k.shadowroot || k.shadowrootmode) && (s = se.call(r, s, !0)),
          s
        );
      }
      let u = Ae ? i.outerHTML : i.innerHTML;
      return (
        Ae &&
          _e[`!doctype`] &&
          i.ownerDocument &&
          i.ownerDocument.doctype &&
          i.ownerDocument.doctype.name &&
          bs(Js, i.ownerDocument.doctype.name) &&
          (u =
            `<!DOCTYPE ` +
            i.ownerDocument.doctype.name +
            `>
` +
            u),
        Oe &&
          ns([ce, le, ue], (e) => {
            u = ds(u, e, ` `);
          }),
        x && Ne ? E(u) : u
      );
    }),
    (t.setConfig = function () {
      (at(arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}),
        (je = !0));
    }),
    (t.clearConfig = function () {
      ((nt = null), (je = !1), (x = C), (S = ``));
    }),
    (t.isValidAttribute = function (e, t, n) {
      return (nt || at({}), xt(tt(e), tt(t), n));
    }),
    (t.addHook = function (e, t) {
      typeof t == `function` && as(O[e], t);
    }),
    (t.removeHook = function (e, t) {
      if (t !== void 0) {
        let n = rs(O[e], t);
        return n === -1 ? void 0 : os(O[e], n, 1)[0];
      }
      return is(O[e]);
    }),
    (t.removeHooks = function (e) {
      O[e] = [];
    }),
    (t.removeAllHooks = function () {
      O = $s();
    }),
    t
  );
}
var tc = ec(),
  nc = K(
    `<div class="blocked-card paper-card svelte-1grjwjw" style="grid-column: span 2; text-align: center; padding: 40px; margin: 40px auto; max-width: 600px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 4px; height: fit-content; box-shadow: var(--shadow-paper);"><h3 style="color: #c53030; margin-bottom: 20px; font-family: var(--font-sans); font-size: 16px; border-bottom: 1px dashed #fed7d7; padding-bottom: 10px;" class="svelte-1grjwjw">🔒 知识库已锁定</h3> <p style="color: #9b2c2c; font-size: 14px;" class="svelte-1grjwjw">您的账户目前处于待激活状态，暂时无法浏览或阅读知识库。请联系系统管理员进行激活。</p></div>`,
  ),
  rc = K(
    `<button class="clear-tag-btn svelte-1grjwjw" title="清除标签筛选"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><path d="M18 6 6 18" class="svelte-1grjwjw"></path><path d="m6 6 12 12" class="svelte-1grjwjw"></path></svg></button>`,
  ),
  ic = K(`<div class="no-tags-found svelte-1grjwjw">无匹配标签</div>`),
  ac = K(
    `<button><span class="tag-name svelte-1grjwjw"> </span> <span class="tag-count svelte-1grjwjw"> </span></button>`,
  ),
  oc = K(
    `<div class="tag-popover svelte-1grjwjw"><div class="tag-popover-search svelte-1grjwjw"><input type="text" class="paper-input tag-search svelte-1grjwjw" placeholder="搜索标签..."/></div> <div class="tag-popover-list svelte-1grjwjw"><!></div></div>`,
  ),
  sc = K(`<div class="loading-state svelte-1grjwjw">载入中...</div>`),
  cc = K(
    `<div class="empty-state svelte-1grjwjw">没有符合条件的知识条目</div>`,
  ),
  lc = K(`<span class="note-tag-pill svelte-1grjwjw"> </span>`),
  uc = K(`<div class="note-item-tags svelte-1grjwjw"></div>`),
  dc = K(
    `<div><div class="note-item-title svelte-1grjwjw"> </div> <div class="note-item-meta svelte-1grjwjw"><span> </span> <span class="note-date svelte-1grjwjw"> </span></div> <!></div>`,
  ),
  fc = K(`<div class="notes-list svelte-1grjwjw"></div>`),
  pc = K(`<div class="error-msg svelte-1grjwjw" style="margin: 20px;"> </div>`),
  mc = K(
    `<div class="detail-loading svelte-1grjwjw"><div class="spinner svelte-1grjwjw">✍️</div> <p class="svelte-1grjwjw">正在翻阅笔记...</p></div>`,
  ),
  hc = K(
    `<span class="note-tag-pill editing svelte-1grjwjw"> <button class="remove-tag-btn svelte-1grjwjw">×</button></span>`,
  ),
  gc = K(
    `<div class="edit-pane-editor svelte-1grjwjw"><textarea class="editor-textarea svelte-1grjwjw" placeholder="使用 Markdown 编写内容..."></textarea></div>`,
  ),
  _c = K(
    `<div class="preview-pane-viewer markdown-body text-layout svelte-1grjwjw"></div>`,
  ),
  vc = K(
    `<span class="uploading-indicator svelte-1grjwjw">正在上传文件...</span>`,
  ),
  yc = K(
    `<div class="attachment-edit-card svelte-1grjwjw"><div class="att-info svelte-1grjwjw"><div class="att-name svelte-1grjwjw"> </div> <div class="att-size svelte-1grjwjw"> </div></div> <div class="att-actions svelte-1grjwjw"><button class="att-action-btn insert-btn svelte-1grjwjw" title="插入正文光标处">📥 插入</button> <button class="att-action-btn delete-btn svelte-1grjwjw" title="移除关联">🗑️ 移除</button></div></div>`,
  ),
  bc = K(
    `<div class="note-editor svelte-1grjwjw"><div class="editor-header svelte-1grjwjw"><h2 class="svelte-1grjwjw">编辑知识条目</h2> <div class="editor-controls svelte-1grjwjw"><div class="view-toggle segmented-control svelte-1grjwjw" style="width: auto;"><button>仅编辑</button> <button>双栏</button> <button>仅预览</button></div> <div class="action-buttons svelte-1grjwjw" style="display: flex; gap: 8px;"><button class="paper-button svelte-1grjwjw">取消</button> <button class="paper-button primary svelte-1grjwjw"> </button></div></div></div> <div class="editor-metadata svelte-1grjwjw"><div class="form-group svelte-1grjwjw"><label for="edit-title" class="svelte-1grjwjw">标题:</label> <input id="edit-title" type="text" class="paper-input svelte-1grjwjw" placeholder="文章标题"/></div> <div class="form-group svelte-1grjwjw"><label for="edit-source" class="svelte-1grjwjw">来源 URL:</label> <input id="edit-source" type="text" class="paper-input svelte-1grjwjw" placeholder="https://..."/></div> <div class="form-group svelte-1grjwjw"><label class="svelte-1grjwjw">标签 (按 Enter 添加):</label> <div class="tag-input-container svelte-1grjwjw"><div class="edit-tags-list svelte-1grjwjw"></div> <input type="text" class="paper-input tag-input-box svelte-1grjwjw" placeholder="输入新标签并回车"/></div></div></div> <div><!> <!></div> <div class="editor-attachments-shelf svelte-1grjwjw"><h3 class="svelte-1grjwjw"> </h3> <div class="upload-bar svelte-1grjwjw"><label class="paper-button upload-btn svelte-1grjwjw" style="cursor: pointer; margin-bottom: 0;">📤 选择文件上传 <input type="file" style="display: none;" class="svelte-1grjwjw"/></label> <!></div> <div class="attachments-edit-grid svelte-1grjwjw"></div></div></div>`,
  ),
  xc = Fr(
    `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" class="svelte-1grjwjw"></path><line x1="12" x2="12" y1="9" y2="13" class="svelte-1grjwjw"></line><line x1="12" x2="12.01" y1="17" y2="17" class="svelte-1grjwjw"></line></svg> 再次点击以确认`,
    1,
  ),
  Sc = Fr(
    `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><path d="M3 6h18" class="svelte-1grjwjw"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" class="svelte-1grjwjw"></path><path d="8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" class="svelte-1grjwjw"></path><line x1="10" x2="10" y1="11" y2="17" class="svelte-1grjwjw"></line><line x1="14" x2="14" y1="11" y2="17" class="svelte-1grjwjw"></line></svg> 删除`,
    1,
  ),
  Cc = K(
    `<div class="meta-row svelte-1grjwjw"><span class="meta-label svelte-1grjwjw">原始来源:</span> <span class="meta-value svelte-1grjwjw"><a target="_blank" rel="noopener noreferrer" class="svelte-1grjwjw"> </a></span></div>`,
  ),
  wc = K(
    `<div class="meta-row align-center svelte-1grjwjw"><span class="meta-label svelte-1grjwjw">标签归属:</span> <div class="meta-tags-list svelte-1grjwjw"></div></div>`,
  ),
  Tc = K(`<img loading="lazy" class="svelte-1grjwjw"/>`),
  Ec = K(
    `<div class="file-icon-placeholder svelte-1grjwjw"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="file-icon-svg svelte-1grjwjw"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" class="svelte-1grjwjw"></path><path d="M14 2v4a2 2 0 0 0 2 2h4" class="svelte-1grjwjw"></path></svg> <span class="file-ext svelte-1grjwjw"> </span></div>`,
  ),
  Dc = K(
    `<span class="attachment-desc-sep svelte-1grjwjw">•</span> <span class="attachment-desc svelte-1grjwjw"> </span>`,
    1,
  ),
  Oc = K(
    `<a class="attachment-card svelte-1grjwjw" target="_blank"><div class="attachment-preview svelte-1grjwjw"><!> <div class="attachment-hover-overlay svelte-1grjwjw"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hover-download-svg svelte-1grjwjw"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" class="svelte-1grjwjw"></path><polyline points="7 10 12 15 17 10" class="svelte-1grjwjw"></polyline><line x1="12" x2="12" y1="15" y2="3" class="svelte-1grjwjw"></line></svg></div></div> <div class="attachment-details svelte-1grjwjw"><div class="attachment-name svelte-1grjwjw"> </div> <div class="attachment-meta svelte-1grjwjw"><span class="attachment-size svelte-1grjwjw"> </span> <!></div></div></a>`,
  ),
  kc = K(
    `<div class="attachments-shelf svelte-1grjwjw"><h3 class="svelte-1grjwjw"> </h3> <div class="attachments-grid svelte-1grjwjw"></div></div>`,
  ),
  Ac = K(
    `<div class="note-paper svelte-1grjwjw"><div class="note-header svelte-1grjwjw"><div class="note-header-top svelte-1grjwjw"><h1 class="svelte-1grjwjw"> </h1> <div class="note-actions svelte-1grjwjw" style="display: flex; gap: 8px;"><button class="delete-btn svelte-1grjwjw" style="border-color: var(--accent-sage); color: var(--accent-sage); background: rgba(74, 107, 93, 0.04);"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><path d="M12 20h9" class="svelte-1grjwjw"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" class="svelte-1grjwjw"></path></svg> 编辑</button> <button><!></button></div></div> <div class="metadata-block svelte-1grjwjw"><div class="meta-row svelte-1grjwjw"><span class="meta-label svelte-1grjwjw">标识 (ID):</span> <span class="meta-value font-mono svelte-1grjwjw"> </span></div> <!> <div class="meta-row svelte-1grjwjw"><span class="meta-label svelte-1grjwjw">创建时间:</span> <span class="meta-value svelte-1grjwjw"> </span></div> <!></div></div> <div class="markdown-body text-layout svelte-1grjwjw"></div> <!></div>`,
  ),
  jc = K(`<div><!></div>`),
  Mc = K(
    `<div class="no-selection svelte-1grjwjw"><span class="book-icon svelte-1grjwjw">📖</span> <h3 class="svelte-1grjwjw">开启您的知识翻阅</h3> <p class="svelte-1grjwjw">请从左侧列表中点击一篇知识笔记开始阅读，或键入关键字快速检索</p></div>`,
  ),
  Nc = K(
    `<div class="modal-form-group svelte-1grjwjw"><label for="create-note-subcategory" class="svelte-1grjwjw">子分类名 (如 frontend, general)</label> <input id="create-note-subcategory" type="text" class="paper-input svelte-1grjwjw" placeholder="请输入子分类..."/></div>`,
  ),
  Pc = K(
    `<div class="modal-overlay svelte-1grjwjw"><div class="modal-container svelte-1grjwjw"><div class="modal-header svelte-1grjwjw"><h3 class="svelte-1grjwjw">新建知识条目</h3> <button class="modal-close-btn svelte-1grjwjw"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><line x1="18" x2="6" y1="6" y2="18" class="svelte-1grjwjw"></line><line x1="6" x2="18" y1="6" y2="18" class="svelte-1grjwjw"></line></svg></button></div> <div class="modal-body svelte-1grjwjw"><div class="modal-form-group svelte-1grjwjw"><label for="create-note-title" class="svelte-1grjwjw">标题</label> <input id="create-note-title" type="text" class="paper-input svelte-1grjwjw" placeholder="请输入笔记标题..."/></div> <div class="modal-form-group svelte-1grjwjw"><label for="create-note-category" class="svelte-1grjwjw">分类目录</label> <select id="create-note-category" class="svelte-1grjwjw"><option class="svelte-1grjwjw">待整理 (inbox)</option><option class="svelte-1grjwjw">随笔 (daily)</option><option class="svelte-1grjwjw">专题 (topics)</option></select></div> <!></div> <div class="modal-footer svelte-1grjwjw"><button class="paper-button svelte-1grjwjw">取消</button> <button class="paper-button primary svelte-1grjwjw"> </button></div></div></div>`,
  ),
  Fc = K(
    `<div class="list-pane svelte-1grjwjw"><div class="list-header svelte-1grjwjw"><div class="search-row-container svelte-1grjwjw" style="display: flex; gap: 8px; align-items: center; width: 100%;"><div class="search-input-wrapper svelte-1grjwjw" style="flex: 1; position: relative;"><svg class="search-icon-svg svelte-1grjwjw" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" class="svelte-1grjwjw"></circle><path d="m21 21-4.3-4.3" class="svelte-1grjwjw"></path></svg> <input type="text" class="paper-input svelte-1grjwjw" placeholder="搜索笔记标题或标签..."/></div> <button class="paper-button primary svelte-1grjwjw" style="padding: 10px; border-radius: 8px; flex-shrink: 0; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;" title="新建知识条目" aria-label="新建知识条目"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><path d="M5 12h14" class="svelte-1grjwjw"></path><path d="M12 5v14" class="svelte-1grjwjw"></path></svg></button></div> <div class="segmented-control svelte-1grjwjw"><button>全部</button> <button>待整理</button> <button>专题</button> <button>随笔</button></div> <div class="tag-filter-bar svelte-1grjwjw"><button><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svelte-1grjwjw"><path d="M12 2H2v10l9.29 9.29c.39.39 1.02.39 1.41 0l7.59-7.59c.39-.39.39-1.02 0-1.41L12 2z" class="svelte-1grjwjw"></path><path d="m7 7-.01.01" class="svelte-1grjwjw"></path></svg> <!></button> <!> <!></div></div> <div class="notes-scroll-container svelte-1grjwjw"><!></div></div> <div class="reader-pane svelte-1grjwjw"><div class="reader-header-bar svelte-1grjwjw"><button class="toggle-list-btn svelte-1grjwjw"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu svelte-1grjwjw"><line x1="4" x2="20" y1="12" y2="12" class="svelte-1grjwjw"></line><line x1="4" x2="20" y1="6" y2="6" class="svelte-1grjwjw"></line><line x1="4" x2="20" y1="18" y2="18" class="svelte-1grjwjw"></line></svg></button></div> <!> <!></div> <!>`,
    1,
  );
function Ic(e, t) {
  We(t, !0);
  let n = Ai(t, `isBlocked`, 3, !1),
    r = L($t([])),
    i = L($t([])),
    a = L(!1),
    o = L(!1),
    s = L(``),
    c = L(`inbox`),
    l = L(``),
    u = L(!1),
    d = L(!1),
    f = L(``),
    p = L(``),
    m = L($t([])),
    h = L(``),
    g = L($t([])),
    _ = L(!1),
    v = L(`split`),
    y = L(null),
    b = L(!1),
    x = L(``),
    S = L(`all`),
    C = L(null),
    w = L(!1),
    T = L(!1),
    ee = L(``),
    E = L(null);
  En(() => {
    W(T) && W(E) && W(E).focus();
  });
  let te = L(null),
    D = L(null),
    ne = L(!1),
    re = L(``);
  async function ie() {
    if (!n()) {
      (R(a, !0), R(re, ``));
      try {
        let e = new URLSearchParams();
        (e.append(`page`, `1`),
          e.append(`per_page`, `200`),
          W(S) !== `all` && e.append(`category`, W(S)),
          W(C) && e.append(`tags`, W(C)));
        let t = await Gi(`/api/v1/knowledge?${e.toString()}`);
        t.error ? R(re, t.error.message, !0) : R(r, t.data?.entries || [], !0);
      } finally {
        R(a, !1);
      }
    }
  }
  async function ae() {
    if (n()) return;
    let e = await Gi(`/api/v1/knowledge/tags`);
    !e.error && e.data && R(i, e.data.tags || [], !0);
  }
  async function oe(e) {
    (R(te, e, !0), R(D, null), R(ne, !0), R(re, ``));
    try {
      let t = await Gi(`/api/v1/knowledge/${encodeURIComponent(e)}`);
      t.error ? R(re, t.error.message, !0) : R(D, t.data, !0);
    } finally {
      R(ne, !1);
    }
  }
  let se = L(!1),
    O = null;
  function ce() {
    W(D) &&
      (W(se)
        ? ((O &&= (clearTimeout(O), null)), R(se, !1), le(W(D).id))
        : (R(se, !0),
          (O = setTimeout(() => {
            R(se, !1);
          }, 3e3))));
  }
  async function le(e) {
    R(re, ``);
    let t = await Gi(`/api/v1/knowledge/${encodeURIComponent(e)}`, {
      method: `DELETE`,
    });
    t.error
      ? R(re, t.error.message, !0)
      : (R(te, null), R(D, null), await ie(), await ae());
  }
  En(() => {
    W(te) && (R(se, !1), R(d, !1), (O &&= (clearTimeout(O), null)));
  });
  function ue(e) {
    (R(S, e, !0), R(C, null), ie());
  }
  function de(e) {
    return e
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, `-`)
      .replace(/^-+|-+$/g, ``);
  }
  async function fe() {
    if (W(s).trim()) {
      R(u, !0);
      try {
        let e = de(W(s)) || `untitled`,
          t = new Date(),
          n = t.toISOString().split(`T`)[0],
          r = t.toTimeString().split(` `)[0].replace(/:/g, ``),
          i = W(c);
        W(c) === `topics` && (i = `topics/${W(l).trim() || `general`}`);
        let a = `${i}/${n}-${e}-${r}.md`,
          u = await Gi(`/api/v1/knowledge/${encodeURIComponent(a)}`, {
            method: `PUT`,
            body: JSON.stringify({
              title: W(s),
              content: `# ${W(s)}\n\n开始编写您的笔记内容...`,
              tags: [],
            }),
          });
        u.error
          ? alert(`创建笔记失败: ${u.error.message}`)
          : (R(o, !1), R(s, ``), R(l, ``), await ie(), await oe(a), pe());
      } finally {
        R(u, !1);
      }
    }
  }
  function pe() {
    W(D) &&
      (R(f, W(D).title, !0),
      R(p, W(D).content, !0),
      R(m, [...W(D).tags], !0),
      R(h, W(D).source_url || ``, !0),
      R(g, [...(W(D).attachments || [])], !0),
      R(d, !0),
      R(v, `split`));
  }
  async function me() {
    if (W(D)) {
      R(_, !0);
      try {
        let e = await Gi(`/api/v1/knowledge/${encodeURIComponent(W(D).id)}`, {
          method: `PUT`,
          body: JSON.stringify({
            title: W(f),
            content: W(p),
            tags: W(m),
            source: W(h),
            attachments: W(g),
          }),
        });
        e.error
          ? alert(`保存失败: ${e.error.message}`)
          : (R(d, !1), await ie(), await oe(W(D).id));
      } finally {
        R(_, !1);
      }
    }
  }
  function he() {
    R(d, !1);
  }
  async function ge(e) {
    let t = e.target;
    if (!t.files || t.files.length === 0) return;
    let n = t.files[0];
    R(b, !0);
    try {
      let e = new FormData();
      e.append(`file`, n);
      let t = Hi(),
        r = new Headers();
      t && r.set(`Authorization`, `Bearer ${t}`);
      let i = await fetch(Vi(`/api/v1/attachments`), {
        method: `POST`,
        headers: r,
        body: e,
      });
      if (!i.ok) throw Error(`Upload failed with status ${i.status}`);
      let a = await i.json();
      a.filename &&
        R(
          g,
          [
            ...W(g),
            {
              name: a.filename,
              size: a.size,
              mime_type: a.mime_type,
              description: ``,
            },
          ],
          !0,
        );
    } catch (e) {
      alert(`上传附件失败: ${e.message}`);
    } finally {
      (R(b, !1), (t.value = ``));
    }
  }
  function _e(e) {
    if (!W(y)) return;
    let t = W(y),
      n = t.selectionStart,
      r = t.selectionEnd,
      i = t.value,
      a = [`png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`].includes(
        e.name.split(`.`).pop()?.toLowerCase() || ``,
      )
        ? `![${e.name}](attachments/${e.name})`
        : `[${e.name}](attachments/${e.name})`;
    (R(p, i.substring(0, n) + a + i.substring(r)),
      setTimeout(() => {
        (t.focus(), t.setSelectionRange(n + a.length, n + a.length));
      }, 0));
  }
  function ve(e) {
    R(
      g,
      W(g).filter((t) => t.name !== e),
      !0,
    );
  }
  let k = F(() => () => {
    if (!W(D)) return ``;
    let e = W(p),
      t = Se(W(D).id),
      n = Q.parse(e);
    n = tc.sanitize(n);
    let r = Hi(),
      i = n.replace(/src=["']assets\/([^"']+)["']/g, (e, n) => {
        let i = Vi(`/api/v1/attachments/notes/${t}/assets/${n}`);
        return (r && (i += `?token=${encodeURIComponent(r)}`), `src="${i}"`);
      });
    return (
      (i = i.replace(/src=["']attachments\/([^"']+)["']/g, (e, t) => {
        let n = Vi(`/api/v1/attachments/file/${t}`);
        return (r && (n += `?token=${encodeURIComponent(r)}`), `src="${n}"`);
      })),
      i
    );
  });
  function ye(e) {
    (R(C, W(C) === e ? null : e, !0), R(T, !1), ie());
  }
  let be = F(() => () => {
      if (!W(x)) return W(r);
      let e = W(x).toLowerCase();
      return W(r).filter(
        (t) =>
          t.title.toLowerCase().includes(e) ||
          t.tags.some((t) => t.toLowerCase().includes(e)),
      );
    }),
    xe = F(() => () => {
      let e = [...W(i)].sort((e, t) => t.count - e.count);
      if (!W(ee)) return e;
      let t = W(ee).toLowerCase();
      return e.filter((e) => e.name.toLowerCase().includes(t));
    });
  function Se(e) {
    let t = e.split(`/`);
    return (t.pop(), t.join(`/`));
  }
  let Ce = F(() => () => {
    if (!W(D)) return ``;
    let e = W(D).content,
      t = Se(W(D).id),
      n = Q.parse(e);
    n = tc.sanitize(n);
    let r = Hi();
    return n.replace(/src=["']assets\/([^"']+)["']/g, (e, n) => {
      let i = Vi(`/api/v1/attachments/notes/${t}/assets/${n}`);
      return (r && (i += `?token=${encodeURIComponent(r)}`), `src="${i}"`);
    });
  });
  function we(e) {
    if (!e) return `0 B`;
    let t = 1024,
      n = [`B`, `KB`, `MB`, `GB`],
      r = Math.floor(Math.log(e) / Math.log(t));
    return parseFloat((e / t ** r).toFixed(2)) + ` ` + n[r];
  }
  function Te(e) {
    if (!e) return ``;
    try {
      return new Date(e).toLocaleString(`zh-CN`, {
        year: `numeric`,
        month: `2-digit`,
        day: `2-digit`,
        hour: `2-digit`,
        minute: `2-digit`,
      });
    } catch {
      return e;
    }
  }
  function Ee(e) {
    if (!W(D)) return ``;
    let t = Vi(
        `/api/v1/attachments/notes/${Se(W(D).id)}/assets/${encodeURIComponent(e)}`,
      ),
      n = Hi();
    return (n && (t += `?token=${encodeURIComponent(n)}`), t);
  }
  function De(e) {
    let t = e.split(`.`).pop()?.toLowerCase();
    return [`png`, `jpg`, `jpeg`, `gif`, `webp`, `svg`, `bmp`].includes(
      t || ``,
    );
  }
  function Oe(e) {
    return e.split(`.`).pop()?.toUpperCase() || `FILE`;
  }
  function ke(e) {
    if (W(T)) {
      let t = document.querySelector(`.tag-trigger-btn`),
        n = document.querySelector(`.tag-popover`);
      t && n && !t.contains(e.target) && !n.contains(e.target) && R(T, !1);
    }
  }
  (Li(() => {
    (n() || (ie(), ae()), window.addEventListener(`click`, ke));
  }),
    Ri(() => {
      window.removeEventListener(`click`, ke);
    }));
  var Ae = jc(),
    je = z(Ae),
    A = (e) => {
      q(e, nc());
    },
    Me = (e) => {
      var t = Fc(),
        n = dn(t),
        r = z(n),
        i = z(r),
        ie = z(i),
        ae = B(z(ie), 2);
      (bi(ae), M(ie));
      var O = B(ie, 2);
      M(i);
      var le = B(i, 2),
        de = z(le),
        Se = B(de, 2),
        ke = B(Se, 2),
        Ae = B(ke, 2);
      M(le);
      var je = B(le, 2),
        A = z(je),
        Me = B(z(A), 2),
        j = (e) => {
          var t = Ir();
          (V(() => J(t, `标签: #${W(C) ?? ``}`)), q(e, t));
        },
        Ne = (e) => {
          q(e, Ir(`按标签筛选`));
        };
      (Y(Me, (e) => {
        W(C) ? e(j) : e(Ne, -1);
      }),
        M(A));
      var Pe = B(A, 2),
        Ie = (e) => {
          var t = rc();
          (G(`click`, t, () => ye(null)), q(e, t));
        };
      Y(Pe, (e) => {
        W(C) && e(Ie);
      });
      var Le = B(Pe, 2),
        Re = (e) => {
          var t = oc(),
            n = z(t),
            r = z(n);
          (bi(r),
            ki(
              r,
              (e) => R(E, e),
              () => W(E),
            ),
            M(n));
          var i = B(n, 2),
            a = z(i),
            o = (e) => {
              q(e, ic());
            },
            s = F(() => W(xe)().length === 0),
            c = (e) => {
              var t = Lr();
              (Yr(
                dn(t),
                17,
                () => W(xe)(),
                Gr,
                (e, t) => {
                  var n = ac(),
                    r = z(n),
                    i = z(r);
                  M(r);
                  var a = B(r, 2),
                    o = z(a, !0);
                  (M(a),
                    M(n),
                    V(() => {
                      (X(
                        n,
                        1,
                        `tag-option ${W(C) === W(t).name ? `active` : ``}`,
                        `svelte-1grjwjw`,
                      ),
                        J(i, `#${W(t).name ?? ``}`),
                        J(o, W(t).count));
                    }),
                    G(`click`, n, () => ye(W(t).name)),
                    q(e, n));
                },
              ),
                q(e, t));
            };
          (Y(a, (e) => {
            W(s) ? e(o) : e(c, -1);
          }),
            M(i),
            M(t),
            Ti(
              r,
              () => W(ee),
              (e) => R(ee, e),
            ),
            q(e, t));
        };
      (Y(Le, (e) => {
        W(T) && e(Re);
      }),
        M(je),
        M(r));
      var ze = B(r, 2),
        Be = z(ze),
        Ve = (e) => {
          q(e, sc());
        },
        He = (e) => {
          q(e, cc());
        },
        N = F(() => W(be)().length === 0),
        Ue = (e) => {
          var t = fc();
          (Yr(
            t,
            21,
            () => W(be)(),
            Gr,
            (e, t) => {
              var n = dc(),
                r = z(n),
                i = z(r, !0);
              M(r);
              var a = B(r, 2),
                o = z(a);
              let s;
              var c = z(o, !0);
              M(o);
              var l = B(o, 2),
                u = z(l, !0);
              (M(l), M(a));
              var d = B(a, 2),
                f = (e) => {
                  var n = uc();
                  (Yr(
                    n,
                    21,
                    () => W(t).tags.slice(0, 3),
                    Gr,
                    (e, t) => {
                      var n = lc(),
                        r = z(n);
                      (M(n), V(() => J(r, `#${W(t) ?? ``}`)), q(e, n));
                    },
                  ),
                    M(n),
                    q(e, n));
                };
              (Y(d, (e) => {
                W(t).tags && W(t).tags.length > 0 && e(f);
              }),
                M(n),
                V(
                  (e) => {
                    (X(
                      n,
                      1,
                      `note-item ${W(te) === W(t).id ? `selected` : ``}`,
                      `svelte-1grjwjw`,
                    ),
                      J(i, W(t).title),
                      (s = X(o, 1, `note-type svelte-1grjwjw`, null, s, {
                        excerpt: W(t).type === `excerpt`,
                        note: W(t).type === `note`,
                      })),
                      J(
                        c,
                        W(t).type === `excerpt`
                          ? `摘录`
                          : W(t).type === `note`
                            ? `笔记`
                            : W(t).type,
                      ),
                      J(u, e));
                  },
                  [() => Te(W(t).created_at)],
                ),
                G(`click`, n, () => oe(W(t).id)),
                q(e, n));
            },
          ),
            M(t),
            q(e, t));
        };
      (Y(Be, (e) => {
        W(a) ? e(Ve) : W(N) ? e(He, 1) : e(Ue, -1);
      }),
        M(ze),
        M(n));
      var We = B(n, 2),
        Ge = z(We),
        Ke = z(Ge);
      M(Ge);
      var qe = B(Ge, 2),
        Je = (e) => {
          var t = pc(),
            n = z(t);
          (M(t), V(() => J(n, `⚠️ ${W(re) ?? ``}`)), q(e, t));
        };
      Y(qe, (e) => {
        W(re) && e(Je);
      });
      var Ye = B(qe, 2),
        Xe = (e) => {
          q(e, mc());
        },
        Ze = (e) => {
          var t = jc();
          let n;
          var r = z(t),
            i = (e) => {
              var t = bc(),
                n = z(t),
                r = B(z(n), 2),
                i = z(r),
                a = z(i),
                o = B(a, 2),
                s = B(o, 2);
              M(i);
              var c = B(i, 2),
                l = z(c),
                u = B(l, 2),
                d = z(u, !0);
              (M(u), M(c), M(r), M(n));
              var x = B(n, 2),
                S = z(x),
                C = B(z(S), 2);
              (bi(C), M(S));
              var w = B(S, 2),
                T = B(z(w), 2);
              (bi(T), M(w));
              var ee = B(w, 2),
                E = B(z(ee), 2),
                te = z(E);
              (Yr(
                te,
                21,
                () => W(m),
                Gr,
                (e, t) => {
                  var n = hc(),
                    r = z(n),
                    i = B(r);
                  (M(n),
                    V(() => J(r, `#${W(t) ?? ``} `)),
                    G(`click`, i, () =>
                      R(
                        m,
                        W(m).filter((e) => e !== W(t)),
                        !0,
                      ),
                    ),
                    q(e, n));
                },
              ),
                M(te));
              var D = B(te, 2);
              (M(E), M(ee), M(x));
              var ne = B(x, 2),
                re = z(ne),
                ie = (e) => {
                  var t = gc(),
                    n = z(t);
                  (gn(n),
                    ki(
                      n,
                      (e) => R(y, e),
                      () => W(y),
                    ),
                    M(t),
                    Ti(
                      n,
                      () => W(p),
                      (e) => R(p, e),
                    ),
                    q(e, t));
                };
              Y(re, (e) => {
                (W(v) === `edit` || W(v) === `split`) && e(ie);
              });
              var ae = B(re, 2),
                oe = (e) => {
                  var t = _c();
                  (ti(t, () => W(k)(), !0), M(t), q(e, t));
                };
              (Y(ae, (e) => {
                (W(v) === `preview` || W(v) === `split`) && e(oe);
              }),
                M(ne));
              var se = B(ne, 2),
                O = z(se),
                ce = z(O);
              M(O);
              var le = B(O, 2),
                ue = z(le),
                de = B(z(ue));
              M(ue);
              var fe = B(ue, 2),
                pe = (e) => {
                  q(e, vc());
                };
              (Y(fe, (e) => {
                W(b) && e(pe);
              }),
                M(le));
              var ye = B(le, 2);
              (Yr(
                ye,
                21,
                () => W(g),
                Gr,
                (e, t) => {
                  var n = yc(),
                    r = z(n),
                    i = z(r),
                    a = z(i, !0);
                  M(i);
                  var o = B(i, 2),
                    s = z(o, !0);
                  (M(o), M(r));
                  var c = B(r, 2),
                    l = z(c),
                    u = B(l, 2);
                  (M(c),
                    M(n),
                    V(
                      (e) => {
                        (xi(i, `title`, W(t).name), J(a, W(t).name), J(s, e));
                      },
                      [() => we(W(t).size)],
                    ),
                    G(`click`, l, () => _e(W(t))),
                    G(`click`, u, () => ve(W(t).name)),
                    q(e, n));
                },
              ),
                M(ye),
                M(se),
                M(t),
                V(() => {
                  (X(
                    a,
                    1,
                    `segment-btn ${W(v) === `edit` ? `active` : ``}`,
                    `svelte-1grjwjw`,
                  ),
                    X(
                      o,
                      1,
                      `segment-btn ${W(v) === `split` ? `active` : ``}`,
                      `svelte-1grjwjw`,
                    ),
                    X(
                      s,
                      1,
                      `segment-btn ${W(v) === `preview` ? `active` : ``}`,
                      `svelte-1grjwjw`,
                    ),
                    (u.disabled = W(_)),
                    J(d, W(_) ? `正在保存...` : `保存`),
                    X(
                      ne,
                      1,
                      `editor-workspace ${W(v) ?? ``}`,
                      `svelte-1grjwjw`,
                    ),
                    J(ce, `📎 附件管理 (${W(g).length ?? ``})`));
                }),
                G(`click`, a, () => R(v, `edit`)),
                G(`click`, o, () => R(v, `split`)),
                G(`click`, s, () => R(v, `preview`)),
                G(`click`, l, he),
                G(`click`, u, me),
                Ti(
                  C,
                  () => W(f),
                  (e) => R(f, e),
                ),
                Ti(
                  T,
                  () => W(h),
                  (e) => R(h, e),
                ),
                G(`keydown`, D, (e) => {
                  if (e.key === `Enter`) {
                    e.preventDefault();
                    let t = e.target.value.trim().replace(/^#/, ``);
                    (t && !W(m).includes(t) && R(m, [...W(m), t], !0),
                      (e.target.value = ``));
                  }
                }),
                G(`change`, de, ge),
                q(e, t));
            },
            a = (e) => {
              var t = Ac(),
                n = z(t),
                r = z(n),
                i = z(r),
                a = z(i, !0);
              M(i);
              var o = B(i, 2),
                s = z(o),
                c = B(s, 2),
                l = z(c),
                u = (e) => {
                  var t = xc();
                  (Fe(), q(e, t));
                },
                d = (e) => {
                  var t = Sc();
                  (Fe(), q(e, t));
                };
              (Y(l, (e) => {
                W(se) ? e(u) : e(d, -1);
              }),
                M(c),
                M(o),
                M(r));
              var f = B(r, 2),
                p = z(f),
                m = B(z(p), 2),
                h = z(m, !0);
              (M(m), M(p));
              var g = B(p, 2),
                _ = (e) => {
                  var t = Cc(),
                    n = B(z(t), 2),
                    r = z(n),
                    i = z(r);
                  (M(r),
                    M(n),
                    M(t),
                    V(() => {
                      (xi(r, `href`, W(D).source_url),
                        J(i, `${W(D).source_url ?? ``} 🔗`));
                    }),
                    q(e, t));
                };
              Y(g, (e) => {
                W(D).source_url && e(_);
              });
              var v = B(g, 2),
                y = B(z(v), 2),
                b = z(y, !0);
              (M(y), M(v));
              var x = B(v, 2),
                S = (e) => {
                  var t = wc(),
                    n = B(z(t), 2);
                  (Yr(
                    n,
                    21,
                    () => W(D).tags,
                    Gr,
                    (e, t) => {
                      var n = lc(),
                        r = z(n);
                      (M(n), V(() => J(r, `#${W(t) ?? ``}`)), q(e, n));
                    },
                  ),
                    M(n),
                    M(t),
                    q(e, t));
                };
              (Y(x, (e) => {
                W(D).tags && W(D).tags.length > 0 && e(S);
              }),
                M(f),
                M(n));
              var C = B(n, 2);
              (ti(C, () => W(Ce)(), !0), M(C));
              var w = B(C, 2),
                T = (e) => {
                  var t = kc(),
                    n = z(t),
                    r = z(n);
                  M(n);
                  var i = B(n, 2);
                  (Yr(
                    i,
                    21,
                    () => W(D).attachments,
                    Gr,
                    (e, t) => {
                      var n = Oc(),
                        r = z(n),
                        i = z(r),
                        a = (e) => {
                          var n = Tc();
                          (V(
                            (e) => {
                              (xi(n, `src`, e), xi(n, `alt`, W(t).name));
                            },
                            [() => Ee(W(t).name)],
                          ),
                            q(e, n));
                        },
                        o = F(() => De(W(t).name)),
                        s = (e) => {
                          var n = Ec(),
                            r = B(z(n), 2),
                            i = z(r, !0);
                          (M(r),
                            M(n),
                            V((e) => J(i, e), [() => Oe(W(t).name)]),
                            q(e, n));
                        };
                      (Y(i, (e) => {
                        W(o) ? e(a) : e(s, -1);
                      }),
                        Fe(2),
                        M(r));
                      var c = B(r, 2),
                        l = z(c),
                        u = z(l, !0);
                      M(l);
                      var d = B(l, 2),
                        f = z(d),
                        p = z(f, !0);
                      M(f);
                      var m = B(f, 2),
                        h = (e) => {
                          var n = Dc(),
                            r = B(dn(n), 2),
                            i = z(r, !0);
                          (M(r),
                            V(() => {
                              (xi(r, `title`, W(t).description),
                                J(i, W(t).description));
                            }),
                            q(e, n));
                        };
                      (Y(m, (e) => {
                        W(t).description && e(h);
                      }),
                        M(d),
                        M(c),
                        M(n),
                        V(
                          (e, r) => {
                            (xi(n, `href`, e),
                              xi(n, `download`, W(t).name),
                              xi(l, `title`, W(t).name),
                              J(u, W(t).name),
                              J(p, r));
                          },
                          [() => Ee(W(t).name), () => we(W(t).size)],
                        ),
                        q(e, n));
                    },
                  ),
                    M(i),
                    M(t),
                    V(() =>
                      J(r, `📎 笔记附件 (${W(D).attachments.length ?? ``})`),
                    ),
                    q(e, t));
                };
              (Y(w, (e) => {
                W(D).attachments && W(D).attachments.length > 0 && e(T);
              }),
                M(t),
                V(
                  (e) => {
                    (J(a, W(D).title),
                      X(
                        c,
                        1,
                        `delete-btn ${W(se) ? `confirm-active` : ``}`,
                        `svelte-1grjwjw`,
                      ),
                      J(h, W(D).id),
                      J(b, e));
                  },
                  [() => Te(W(D).created_at)],
                ),
                G(`click`, s, pe),
                G(`click`, c, ce),
                q(e, t));
            };
          (Y(r, (e) => {
            W(d) ? e(i) : e(a, -1);
          }),
            M(t),
            V(
              () =>
                (n = X(t, 1, `reader-content-wrapper svelte-1grjwjw`, null, n, {
                  "edit-layout": W(d),
                })),
            ),
            q(e, t));
        },
        Qe = (e) => {
          q(e, Mc());
        };
      (Y(Ye, (e) => {
        W(ne) ? e(Xe) : W(D) ? e(Ze, 1) : e(Qe, -1);
      }),
        M(We));
      var $e = B(We, 2),
        P = (e) => {
          var t = Pc(),
            n = z(t),
            r = z(n),
            i = B(z(r), 2);
          M(r);
          var a = B(r, 2),
            d = z(a),
            f = B(z(d), 2);
          (bi(f), M(d));
          var p = B(d, 2),
            m = B(z(p), 2),
            h = z(m);
          h.value = h.__value = `inbox`;
          var g = B(h);
          g.value = g.__value = `daily`;
          var _ = B(g);
          ((_.value = _.__value = `topics`), M(m), M(p));
          var v = B(p, 2),
            y = (e) => {
              var t = Nc(),
                n = B(z(t), 2);
              (bi(n),
                M(t),
                Ti(
                  n,
                  () => W(l),
                  (e) => R(l, e),
                ),
                q(e, t));
            };
          (Y(v, (e) => {
            W(c) === `topics` && e(y);
          }),
            M(a));
          var b = B(a, 2),
            x = z(b),
            S = B(x, 2),
            C = z(S, !0);
          (M(S),
            M(b),
            M(n),
            M(t),
            V(
              (e) => {
                ((S.disabled = e), J(C, W(u) ? `创建中...` : `确认创建`));
              },
              [() => W(u) || !W(s).trim()],
            ),
            G(`click`, i, () => R(o, !1)),
            Ti(
              f,
              () => W(s),
              (e) => R(s, e),
            ),
            hi(
              m,
              () => W(c),
              (e) => R(c, e),
            ),
            G(`click`, x, () => R(o, !1)),
            G(`click`, S, fe),
            q(e, t));
        };
      (Y($e, (e) => {
        W(o) && e(P);
      }),
        V(() => {
          (X(
            de,
            1,
            `segment-btn ${W(S) === `all` ? `active` : ``}`,
            `svelte-1grjwjw`,
          ),
            X(
              Se,
              1,
              `segment-btn ${W(S) === `inbox` ? `active` : ``}`,
              `svelte-1grjwjw`,
            ),
            X(
              ke,
              1,
              `segment-btn ${W(S) === `topics` ? `active` : ``}`,
              `svelte-1grjwjw`,
            ),
            X(
              Ae,
              1,
              `segment-btn ${W(S) === `daily` ? `active` : ``}`,
              `svelte-1grjwjw`,
            ),
            X(
              A,
              1,
              `tag-trigger-btn ${W(C) ? `active` : ``}`,
              `svelte-1grjwjw`,
            ),
            xi(Ke, `title`, W(w) ? `展开笔记列表` : `隐藏笔记列表`),
            xi(Ke, `aria-label`, W(w) ? `展开笔记列表` : `隐藏笔记列表`));
        }),
        Ti(
          ae,
          () => W(x),
          (e) => R(x, e),
        ),
        G(`click`, O, () => R(o, !0)),
        G(`click`, de, () => ue(`all`)),
        G(`click`, Se, () => ue(`inbox`)),
        G(`click`, ke, () => ue(`topics`)),
        G(`click`, Ae, () => ue(`daily`)),
        G(`click`, A, () => R(T, !W(T))),
        G(`click`, Ke, () => R(w, !W(w))),
        q(e, t));
    };
  (Y(je, (e) => {
    n() ? e(A) : e(Me, -1);
  }),
    M(Ae),
    V(() =>
      X(
        Ae,
        1,
        `knowledge-container ${W(w) ? `list-hidden` : ``}`,
        `svelte-1grjwjw`,
      ),
    ),
    q(e, Ae),
    Ge());
}
Dr([`click`, `keydown`, `change`]);
var Lc = K(`<div class="error-banner svelte-13u8u1s"> </div>`),
  Rc = K(`<div class="success-banner svelte-13u8u1s"> </div>`),
  zc = K(
    `<div class="blocked-card paper-card svelte-13u8u1s"><h3 class="svelte-13u8u1s">🔒 密钥管理已锁定</h3> <p class="svelte-13u8u1s">您的账户目前处于待激活状态，暂时无法创建或管理 API 密钥。请联系系统管理员进行激活。</p></div>`,
  ),
  Bc = K(
    `<div class="stats-card highlight"><span class="stats-label">系统总密钥数 (管理员)</span> <span class="stats-value"> </span> <span class="stats-desc">所有用户创建的密钥总和</span></div>`,
  ),
  Vc = K(`<div class="loading-state svelte-13u8u1s">正在载入密钥...</div>`),
  Hc = K(
    `<div class="empty-state svelte-13u8u1s">目前还没有生成任何密钥</div>`,
  ),
  Uc = K(
    `<tr class="svelte-13u8u1s"><td class="font-bold svelte-13u8u1s"> </td><td class="svelte-13u8u1s"><code> </code></td><td class="font-sans text-xs text-muted svelte-13u8u1s"> </td><td class="font-sans text-xs text-muted svelte-13u8u1s"> </td><td class="actions-cell svelte-13u8u1s"><button class="revoke-btn svelte-13u8u1s">吊销</button></td></tr>`,
  ),
  Wc = K(
    `<table class="paper-table svelte-13u8u1s"><thead><tr><th class="svelte-13u8u1s">密钥名称</th><th class="svelte-13u8u1s">密钥前缀</th><th class="svelte-13u8u1s">创建时间</th><th class="svelte-13u8u1s">最后使用</th><th class="actions-header svelte-13u8u1s">操作</th></tr></thead><tbody class="svelte-13u8u1s"></tbody></table>`,
  ),
  Gc = K(
    `<div class="stats-row"><div class="stats-card"><span class="stats-label">我的密钥总数</span> <span class="stats-value"> </span> <span class="stats-desc">当前账户下有效的 API Key</span></div> <div class="stats-card"><span class="stats-label">最近活跃时间</span> <span class="stats-value" style="font-size: 18px; margin-top: 10px; font-weight: 600;"> </span> <span class="stats-desc">密钥最近一次调用的时间</span></div> <!></div> <div class="toolbar-row"><div class="toolbar-left"><div class="search-input-wrapper"><svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg> <input type="text" class="paper-input" placeholder="搜索密钥名称或前缀..."/></div></div> <div class="toolbar-right"><button class="paper-button primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> 生成新密钥</button></div></div> <div class="list-card paper-card svelte-13u8u1s"><div class="list-card-header svelte-13u8u1s"><h3 class="svelte-13u8u1s">📋 我的密钥列表</h3> <span class="count-badge svelte-13u8u1s"> </span></div> <!></div>`,
    1,
  ),
  Kc = K(`<div class="loading-state svelte-13u8u1s">载入系统密钥中...</div>`),
  qc = K(`<div class="empty-state svelte-13u8u1s">系统中没有其他密钥</div>`),
  Jc = K(
    `<tr class="svelte-13u8u1s"><td class="svelte-13u8u1s"><div class="user-identity-cell"><div class="avatar-circle" style="color: var(--accent-sage);"> </div> <div class="user-identity-details"><span class="owner-cell font-bold svelte-13u8u1s"> </span></div></div></td><td class="svelte-13u8u1s"> </td><td class="svelte-13u8u1s"><code> </code></td><td class="font-sans text-xs text-muted svelte-13u8u1s"> </td><td class="font-sans text-xs text-muted svelte-13u8u1s"> </td><td class="actions-cell svelte-13u8u1s"><button class="revoke-btn text-red svelte-13u8u1s">强行吊销</button></td></tr>`,
  ),
  Yc = K(
    `<table class="paper-table svelte-13u8u1s"><thead><tr><th class="svelte-13u8u1s">所有者</th><th class="svelte-13u8u1s">密钥名称</th><th class="svelte-13u8u1s">密钥前缀</th><th class="svelte-13u8u1s">创建时间</th><th class="svelte-13u8u1s">最后使用</th><th class="actions-header svelte-13u8u1s">操作</th></tr></thead><tbody class="svelte-13u8u1s"></tbody></table>`,
  ),
  Xc = K(
    `<div class="admin-keys-card paper-card svelte-13u8u1s"><div class="list-card-header svelte-13u8u1s"><div style="text-align: left;"><h3>👥 系统所有密钥 (管理员专属)</h3> <p class="section-desc svelte-13u8u1s">作为管理员，您可以查看并强行吊销本系统所有用户创建的 API 密钥。</p></div> <span class="count-badge svelte-13u8u1s"> </span></div> <!></div>`,
  ),
  Zc = K(
    `<button class="modal-close-btn" aria-label="关闭"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button>`,
  ),
  Qc = K(
    `<div class="modal-body"><div class="raw-key-box" style="margin-top: 0; background: #fffdf5; border: 1px solid #e9d794; border-radius: 6px; padding: 16px;"><div class="raw-key-warning" style="color: #a05e03; font-size: 12px; line-height: 1.5; margin-bottom: 12px;">⚠️ 请立即复制并妥善保存此密钥！出于安全考虑，该密钥<b>仅在此处显示一次</b>，关闭后将无法再找回。</div> <div class="raw-key-row" style="display: flex; flex-direction: column; gap: 12px;"><code class="raw-key-text" style="font-family: monospace; font-size: 13px; padding: 12px; background: #fff; border: 1px solid var(--border-fine); border-radius: 4px; word-break: break-all; user-select: all; text-align: center;"> </code> <button class="paper-button primary" style="width: 100%; height: 38px;"> </button></div></div></div> <div class="modal-footer"><button type="button" class="paper-button" style="width: 100%; border-color: var(--accent-sage); color: var(--accent-sage);">我已安全复制并保存，关闭窗口</button></div>`,
    1,
  ),
  $c = K(
    `<form><div class="modal-body"><div class="form-group svelte-13u8u1s"><label for="key-name" class="svelte-13u8u1s">密钥名称/描述</label> <input type="text" id="key-name" class="paper-input" placeholder="例如：Chrome浏览器扩展" required=""/></div></div> <div class="modal-footer"><button type="button" class="paper-button">取消</button> <button type="submit" class="paper-button primary"> </button></div></form>`,
  ),
  el = K(
    `<div class="modal-overlay"><div class="modal-container"><div class="modal-header"><h3> </h3> <!></div> <!></div></div>`,
  ),
  tl = K(
    `<div class="keys-container svelte-13u8u1s"><div class="header-section svelte-13u8u1s"><h1 class="svelte-13u8u1s">API 访问密钥管理</h1> <p class="description svelte-13u8u1s">API 密钥（以 <code>sk-</code> 开头）用于连接浏览器捕获扩展（Chrome Extension）或外部集成工具。请保护好您的密钥，切勿泄露。</p></div> <!> <!> <!> <!></div> <!>`,
    1,
  );
function nl(e, t) {
  We(t, !0);
  let n = Ai(t, `isAdmin`, 3, !1),
    r = Ai(t, `isBlocked`, 3, !1),
    i = L($t([])),
    a = L($t([])),
    o = L(!1),
    s = L(!1),
    c = L(!1),
    l = L(``),
    u = L(``),
    d = L(!1),
    f = L(null),
    p = L(!1),
    m = L(``),
    h = L(``),
    g = F(() => W(i).length),
    _ = F(() => W(a).length),
    v = F(() => {
      let e = W(i)
        .map((e) => e.last_used_at)
        .filter((e) => !!e)
        .map((e) => new Date(e).getTime());
      if (e.length === 0) return `暂无使用记录`;
      let t = Math.max(...e);
      return new Date(t).toLocaleString(`zh-CN`, {
        month: `2-digit`,
        day: `2-digit`,
        hour: `2-digit`,
        minute: `2-digit`,
      });
    }),
    y = F(() =>
      W(i).filter((e) => {
        let t = W(l).toLowerCase();
        return (
          e.name.toLowerCase().includes(t) || e.prefix.toLowerCase().includes(t)
        );
      }),
    ),
    b = F(() =>
      W(a).filter((e) => {
        let t = W(l).toLowerCase();
        return (
          e.name.toLowerCase().includes(t) ||
          e.prefix.toLowerCase().includes(t) ||
          e.username.toLowerCase().includes(t)
        );
      }),
    );
  async function x() {
    if (!r()) {
      (R(o, !0), R(m, ``));
      try {
        let e = await Gi(`/api/v1/keys`);
        e.error ? R(m, e.error.message, !0) : R(i, e.data?.keys || [], !0);
      } finally {
        R(o, !1);
      }
    }
  }
  async function S() {
    if (n()) {
      R(s, !0);
      try {
        let e = await Gi(`/api/v1/admin/keys`);
        !e.error && e.data && R(a, e.data.keys || [], !0);
      } finally {
        R(s, !1);
      }
    }
  }
  async function C(e) {
    if ((e.preventDefault(), W(u).trim())) {
      (R(d, !0), R(m, ``), R(f, null), R(p, !1));
      try {
        let e = await Gi(`/api/v1/keys`, {
          method: `POST`,
          body: JSON.stringify({ name: W(u) }),
        });
        e.error
          ? R(m, e.error.message, !0)
          : e.data &&
            (R(f, e.data.raw_key, !0),
            R(u, ``),
            R(h, `API 密钥生成成功！`),
            await x(),
            n() && (await S()));
      } finally {
        R(d, !1);
      }
    }
  }
  async function w(e, t = !1) {
    if (!confirm(`确定要永久吊销该密钥吗？被吊销的客户端将无法访问 API。`))
      return;
    (R(m, ``), R(h, ``));
    let r = await Gi(t ? `/api/v1/admin/keys/${e}` : `/api/v1/keys/${e}`, {
      method: `DELETE`,
    });
    r.error
      ? R(m, r.error.message, !0)
      : (R(h, `密钥已成功吊销。`), await x(), n() && (await S()));
  }
  function T() {
    W(f) &&
      (navigator.clipboard.writeText(W(f)),
      R(p, !0),
      setTimeout(() => {
        R(p, !1);
      }, 2e3));
  }
  function ee(e) {
    if (!e) return `未使用`;
    try {
      return new Date(e).toLocaleString(`zh-CN`, {
        year: `numeric`,
        month: `2-digit`,
        day: `2-digit`,
        hour: `2-digit`,
        minute: `2-digit`,
      });
    } catch {
      return e;
    }
  }
  Li(() => {
    (x(), S());
  });
  var E = tl(),
    te = dn(E),
    D = B(z(te), 2),
    ne = (e) => {
      var t = Lc(),
        n = z(t);
      (M(t), V(() => J(n, `⚠️ ${W(m) ?? ``}`)), q(e, t));
    };
  Y(D, (e) => {
    W(m) && e(ne);
  });
  var re = B(D, 2),
    ie = (e) => {
      var t = Rc(),
        n = z(t);
      (M(t), V(() => J(n, `✨ ${W(h) ?? ``}`)), q(e, t));
    };
  Y(re, (e) => {
    W(h) && e(ie);
  });
  var ae = B(re, 2),
    oe = (e) => {
      q(e, zc());
    },
    se = (e) => {
      var t = Gc(),
        r = dn(t),
        i = z(r),
        a = B(z(i), 2),
        s = z(a, !0);
      (M(a), Fe(2), M(i));
      var u = B(i, 2),
        d = B(z(u), 2),
        f = z(d, !0);
      (M(d), Fe(2), M(u));
      var p = B(u, 2),
        m = (e) => {
          var t = Bc(),
            n = B(z(t), 2),
            r = z(n, !0);
          (M(n), Fe(2), M(t), V(() => J(r, W(_))), q(e, t));
        };
      (Y(p, (e) => {
        n() && e(m);
      }),
        M(r));
      var h = B(r, 2),
        b = z(h),
        x = z(b),
        S = B(z(x), 2);
      (bi(S), M(x), M(b));
      var C = B(b, 2),
        T = z(C);
      (M(C), M(h));
      var E = B(h, 2),
        te = z(E),
        D = B(z(te), 2),
        ne = z(D);
      (M(D), M(te));
      var re = B(te, 2),
        ie = (e) => {
          q(e, Vc());
        },
        ae = (e) => {
          q(e, Hc());
        },
        oe = (e) => {
          var t = Wc(),
            n = B(z(t));
          (Yr(
            n,
            21,
            () => W(y),
            Gr,
            (e, t) => {
              var n = Uc(),
                r = z(n),
                i = z(r, !0);
              M(r);
              var a = B(r),
                o = z(a),
                s = z(o);
              (M(o), M(a));
              var c = B(a),
                l = z(c, !0);
              M(c);
              var u = B(c),
                d = z(u, !0);
              M(u);
              var f = B(u),
                p = z(f);
              (M(f),
                M(n),
                V(
                  (e, n) => {
                    (J(i, W(t).name),
                      J(s, `${W(t).prefix ?? ``}***`),
                      J(l, e),
                      J(d, n));
                  },
                  [() => ee(W(t).created_at), () => ee(W(t).last_used_at)],
                ),
                G(`click`, p, () => w(W(t).id, !1)),
                q(e, n));
            },
          ),
            M(n),
            M(t),
            q(e, t));
        };
      (Y(re, (e) => {
        W(o) ? e(ie) : W(y).length === 0 ? e(ae, 1) : e(oe, -1);
      }),
        M(E),
        V(() => {
          (J(s, W(g)), J(f, W(v)), J(ne, `共计 ${W(y).length ?? ``} 项`));
        }),
        Ti(
          S,
          () => W(l),
          (e) => R(l, e),
        ),
        G(`click`, T, () => R(c, !0)),
        q(e, t));
    };
  Y(ae, (e) => {
    r() ? e(oe) : e(se, -1);
  });
  var O = B(ae, 2),
    ce = (e) => {
      var t = Xc(),
        n = z(t),
        r = B(z(n), 2),
        i = z(r);
      (M(r), M(n));
      var a = B(n, 2),
        o = (e) => {
          q(e, Kc());
        },
        c = (e) => {
          q(e, qc());
        },
        l = (e) => {
          var t = Yc(),
            n = B(z(t));
          (Yr(
            n,
            21,
            () => W(b),
            Gr,
            (e, t) => {
              var n = Jc(),
                r = z(n),
                i = z(r),
                a = z(i),
                o = z(a, !0);
              M(a);
              var s = B(a, 2),
                c = z(s),
                l = z(c);
              (M(c), M(s), M(i), M(r));
              var u = B(r),
                d = z(u, !0);
              M(u);
              var f = B(u),
                p = z(f),
                m = z(p);
              (M(p), M(f));
              var h = B(f),
                g = z(h, !0);
              M(h);
              var _ = B(h),
                v = z(_, !0);
              M(_);
              var y = B(_),
                b = z(y);
              (M(y),
                M(n),
                V(
                  (e, n, r) => {
                    (J(o, e),
                      J(l, `👤 ${W(t).username ?? ``}`),
                      J(d, W(t).name),
                      J(m, `${W(t).prefix ?? ``}***`),
                      J(g, n),
                      J(v, r));
                  },
                  [
                    () => W(t).username.charAt(0).toUpperCase(),
                    () => ee(W(t).created_at),
                    () => ee(W(t).last_used_at),
                  ],
                ),
                G(`click`, b, () => w(W(t).id, !0)),
                q(e, n));
            },
          ),
            M(n),
            M(t),
            q(e, t));
        };
      (Y(a, (e) => {
        W(s) ? e(o) : W(b).length === 0 ? e(c, 1) : e(l, -1);
      }),
        M(t),
        V(() => J(i, `共计 ${W(b).length ?? ``} 项`)),
        q(e, t));
    };
  (Y(O, (e) => {
    n() && !r() && e(ce);
  }),
    M(te));
  var le = B(te, 2),
    ue = (e) => {
      var t = el(),
        n = z(t),
        r = z(n),
        i = z(r),
        a = z(i);
      M(i);
      var o = B(i, 2),
        s = (e) => {
          var t = Zc();
          (G(`click`, t, () => R(c, !1)), q(e, t));
        };
      (Y(o, (e) => {
        W(f) || e(s);
      }),
        M(r));
      var l = B(r, 2),
        m = (e) => {
          var t = Qc(),
            n = dn(t),
            r = z(n),
            i = B(z(r), 2),
            a = z(i),
            o = z(a, !0);
          M(a);
          var s = B(a, 2),
            l = z(s, !0);
          (M(s), M(i), M(r), M(n));
          var u = B(n, 2),
            d = z(u);
          (M(u),
            V(() => {
              (J(o, W(f)), J(l, W(p) ? `✓ 已成功复制密钥` : `复制密钥`));
            }),
            G(`click`, s, T),
            G(`click`, d, () => {
              (R(c, !1), R(f, null), R(p, !1));
            }),
            q(e, t));
        },
        h = (e) => {
          var t = $c(),
            n = z(t),
            r = z(n),
            i = B(z(r), 2);
          (bi(i), M(r), M(n));
          var a = B(n, 2),
            o = z(a),
            s = B(o, 2),
            l = z(s, !0);
          (M(s),
            M(a),
            M(t),
            V(() => {
              ((i.disabled = W(d)),
                (o.disabled = W(d)),
                (s.disabled = W(d)),
                J(l, W(d) ? `正在生成...` : `生成 API Key`));
            }),
            Er(`submit`, t, C),
            Ti(
              i,
              () => W(u),
              (e) => R(u, e),
            ),
            G(`click`, o, () => R(c, !1)),
            q(e, t));
        };
      (Y(l, (e) => {
        W(f) ? e(m) : e(h, -1);
      }),
        M(n),
        M(t),
        V(() => J(a, `🔑 ${W(f) ? `API 密钥生成成功` : `生成新密钥`}`)),
        G(`click`, t, (e) => {
          e.target === e.currentTarget && !W(f) && R(c, !1);
        }),
        q(e, t));
    };
  (Y(le, (e) => {
    W(c) && e(ue);
  }),
    q(e, E),
    Ge());
}
Dr([`click`]);
var rl = K(`<div class="error-banner svelte-mp37eg"> </div>`),
  il = K(`<div class="success-banner svelte-mp37eg"> </div>`),
  al = K(`<div class="loading-state svelte-mp37eg">载入用户列表中...</div>`),
  ol = K(
    `<div class="empty-state svelte-mp37eg">没有符合筛选条件的系统用户</div>`,
  ),
  sl = K(`<span class="admin-tag-pill svelte-mp37eg">管理员</span>`),
  cl = K(
    `<span class="status-badge active svelte-mp37eg"><span class="indicator-dot active"></span>已激活</span>`,
  ),
  ll = K(
    `<span class="status-badge inactive svelte-mp37eg"><span class="indicator-dot inactive"></span>待激活</span>`,
  ),
  ul = K(`<span class="disabled-text svelte-mp37eg">核心管理员</span>`),
  dl = K(`<button> </button>`),
  fl = K(
    `<tr><td class="svelte-mp37eg"><div class="user-identity-cell"><div class="avatar-circle"> </div> <div class="user-identity-details"><div class="user-identity-name"> <!></div></div></div></td><td class="font-mono text-xs text-muted svelte-mp37eg"> </td><td class="svelte-mp37eg"><span class="dir-badge svelte-mp37eg">📁 <code class="svelte-mp37eg"> </code></span></td><td class="font-sans text-xs svelte-mp37eg"> </td><td class="svelte-mp37eg"><!></td><td class="actions-cell svelte-mp37eg"><!></td></tr>`,
  ),
  pl = K(
    `<table class="paper-table svelte-mp37eg"><thead><tr><th class="svelte-mp37eg">用户信息</th><th class="svelte-mp37eg">用户 ID</th><th class="svelte-mp37eg">存储目录</th><th class="svelte-mp37eg">注册时间</th><th class="svelte-mp37eg">当前状态</th><th class="actions-header svelte-mp37eg">状态操作</th></tr></thead><tbody class="svelte-mp37eg"></tbody></table>`,
  ),
  ml = K(
    `<div class="modal-overlay"><div class="modal-container"><div class="modal-header"><h3>👥 创建系统新用户</h3> <button class="modal-close-btn" aria-label="关闭"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg></button></div> <form><div class="modal-body"><div class="form-group svelte-mp37eg"><label for="reg-username" class="svelte-mp37eg">新用户名</label> <input type="text" id="reg-username" class="paper-input" placeholder="输入新账号名称" required=""/></div> <div class="form-group svelte-mp37eg"><label for="reg-password" class="svelte-mp37eg">初始密码</label> <input type="password" id="reg-password" class="paper-input" placeholder="输入新账号初始密码" required=""/></div></div> <div class="modal-footer"><button type="button" class="paper-button">取消</button> <button type="submit" class="paper-button primary"> </button></div></form></div></div>`,
  ),
  hl = K(
    `<div class="users-container svelte-mp37eg"><div class="header-section svelte-mp37eg"><h1 class="svelte-mp37eg">系统用户管理 (管理员专属)</h1> <p class="description svelte-mp37eg">系统运行于自托管多用户模式下。在此您可以查看所有注册用户，审核并激活新用户的 API 访问权限。</p></div> <!> <!> <div class="stats-row"><div class="stats-card"><span class="stats-label">总注册用户</span> <span class="stats-value"> </span> <span class="stats-desc">系统内所有已注册账户</span></div> <div><span class="stats-label">待审核激活</span> <span class="stats-value"> </span> <span class="stats-desc">需要管理员人工审批激活</span></div> <div class="stats-card"><span class="stats-label">已激活用户</span> <span class="stats-value" style="color: var(--accent-sage);"> </span> <span class="stats-desc">拥有 API 访问权限的账户</span></div></div> <div class="toolbar-row"><div class="toolbar-left"><div class="search-input-wrapper"><svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg> <input type="text" class="paper-input" placeholder="搜索用户名或 ID..."/></div> <div class="filter-pills"><button>全部</button> <button>已激活</button> <button>待激活</button></div></div> <div class="toolbar-right"><button class="paper-button primary"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> 创建系统新用户</button></div></div> <div class="list-card paper-card svelte-mp37eg"><div class="list-card-header svelte-mp37eg"><h3 class="svelte-mp37eg">📋 系统用户列表</h3> <span class="count-badge svelte-mp37eg"> </span></div> <!></div></div> <!>`,
    1,
  );
function gl(e, t) {
  We(t, !0);
  let n = Ai(t, `currentAdminUsername`, 3, ``),
    r = L($t([])),
    i = L(!1),
    a = L(!1),
    o = L(``),
    s = L(``),
    c = L(!1),
    l = L(``),
    u = L(`all`),
    d = L(``),
    f = L(``),
    p = F(() => W(r).length),
    m = F(() => W(r).filter((e) => e.status === `active`).length),
    h = F(() => W(r).filter((e) => e.status === `inactive`).length),
    g = F(() =>
      W(r).filter((e) => {
        let t =
            e.username.toLowerCase().includes(W(l).toLowerCase()) ||
            e.id.toLowerCase().includes(W(l).toLowerCase()),
          n = W(u) === `all` || e.status === W(u);
        return t && n;
      }),
    );
  async function _() {
    (R(i, !0), R(d, ``));
    try {
      let e = await Gi(`/api/v1/admin/users`);
      e.error ? R(d, e.error.message, !0) : R(r, e.data?.users || [], !0);
    } finally {
      R(i, !1);
    }
  }
  async function v(e, t) {
    let n = t === `active` ? `inactive` : `active`;
    (R(d, ``), R(f, ``));
    let r = await Gi(`/api/v1/admin/users/${e}/status`, {
      method: `PUT`,
      body: JSON.stringify({ status: n }),
    });
    r.error
      ? R(d, r.error.message, !0)
      : (R(f, `用户激活状态已更新。`), await _());
  }
  async function y(e) {
    if ((e.preventDefault(), !(!W(o).trim() || !W(s)))) {
      (R(c, !0), R(d, ``), R(f, ``));
      try {
        let e = await Gi(`/api/v1/auth/register`, {
          method: `POST`,
          body: JSON.stringify({ username: W(o).trim(), password: W(s) }),
        });
        e.error
          ? R(d, e.error.message, !0)
          : e.data &&
            (R(f, `用户 '${W(o)}' 创建成功！账号默认为 '待激活' 状态。`),
            R(o, ``),
            R(s, ``),
            R(a, !1),
            await _());
      } finally {
        R(c, !1);
      }
    }
  }
  function b(e) {
    if (!e) return ``;
    try {
      return new Date(e).toLocaleString(`zh-CN`, {
        year: `numeric`,
        month: `2-digit`,
        day: `2-digit`,
        hour: `2-digit`,
        minute: `2-digit`,
      });
    } catch {
      return e;
    }
  }
  Li(() => {
    _();
  });
  var x = hl(),
    S = dn(x),
    C = B(z(S), 2),
    w = (e) => {
      var t = rl(),
        n = z(t);
      (M(t), V(() => J(n, `⚠️ ${W(d) ?? ``}`)), q(e, t));
    };
  Y(C, (e) => {
    W(d) && e(w);
  });
  var T = B(C, 2),
    ee = (e) => {
      var t = il(),
        n = z(t);
      (M(t), V(() => J(n, `✨ ${W(f) ?? ``}`)), q(e, t));
    };
  Y(T, (e) => {
    W(f) && e(ee);
  });
  var E = B(T, 2),
    te = z(E),
    D = B(z(te), 2),
    ne = z(D, !0);
  (M(D), Fe(2), M(te));
  var re = B(te, 2),
    ie = B(z(re), 2),
    ae = z(ie, !0);
  (M(ie), Fe(2), M(re));
  var oe = B(re, 2),
    se = B(z(oe), 2),
    O = z(se, !0);
  (M(se), Fe(2), M(oe), M(E));
  var ce = B(E, 2),
    le = z(ce),
    ue = z(le),
    de = B(z(ue), 2);
  (bi(de), M(ue));
  var fe = B(ue, 2),
    pe = z(fe),
    me = B(pe, 2),
    he = B(me, 2);
  (M(fe), M(le));
  var ge = B(le, 2),
    _e = z(ge);
  (M(ge), M(ce));
  var ve = B(ce, 2),
    k = z(ve),
    ye = B(z(k), 2),
    be = z(ye);
  (M(ye), M(k));
  var xe = B(k, 2),
    Se = (e) => {
      q(e, al());
    },
    Ce = (e) => {
      q(e, ol());
    },
    we = (e) => {
      var t = pl(),
        r = B(z(t));
      (Yr(
        r,
        21,
        () => W(g),
        Gr,
        (e, t) => {
          var r = fl(),
            i = z(r),
            a = z(i),
            o = z(a),
            s = z(o, !0);
          M(o);
          var c = B(o, 2),
            l = z(c),
            u = z(l),
            d = B(u),
            f = (e) => {
              q(e, sl());
            };
          (Y(d, (e) => {
            W(t).username === n() && e(f);
          }),
            M(l),
            M(c),
            M(a),
            M(i));
          var p = B(i),
            m = z(p, !0);
          M(p);
          var h = B(p),
            g = z(h),
            _ = B(z(g)),
            y = z(_, !0);
          (M(_), M(g), M(h));
          var x = B(h),
            S = z(x, !0);
          M(x);
          var C = B(x),
            w = z(C),
            T = (e) => {
              q(e, cl());
            },
            ee = (e) => {
              q(e, ll());
            };
          (Y(w, (e) => {
            W(t).status === `active` ? e(T) : e(ee, -1);
          }),
            M(C));
          var E = B(C),
            te = z(E),
            D = (e) => {
              q(e, ul());
            },
            ne = (e) => {
              var n = dl(),
                r = z(n, !0);
              (M(n),
                V(() => {
                  (X(
                    n,
                    1,
                    `status-toggle-btn ${W(t).status === `active` ? `deactivate` : `activate`}`,
                    `svelte-mp37eg`,
                  ),
                    J(r, W(t).status === `active` ? `冻结账户` : `激活账户`));
                }),
                G(`click`, n, () => v(W(t).id, W(t).status)),
                q(e, n));
            };
          (Y(te, (e) => {
            W(t).username === n() ? e(D) : e(ne, -1);
          }),
            M(E),
            M(r),
            V(
              (e, i) => {
                (X(
                  r,
                  1,
                  ai(W(t).username === n() ? `admin-row` : ``),
                  `svelte-mp37eg`,
                ),
                  J(s, e),
                  J(u, `${W(t).username ?? ``} `),
                  J(m, W(t).id),
                  J(y, W(t).kb_path),
                  J(S, i));
              },
              [
                () => W(t).username.charAt(0).toUpperCase(),
                () => b(W(t).created_at),
              ],
            ),
            q(e, r));
        },
      ),
        M(r),
        M(t),
        q(e, t));
    };
  (Y(xe, (e) => {
    W(i) ? e(Se) : W(g).length === 0 ? e(Ce, 1) : e(we, -1);
  }),
    M(ve),
    M(S));
  var Te = B(S, 2),
    Ee = (e) => {
      var t = ml(),
        n = z(t),
        r = z(n),
        i = B(z(r), 2);
      M(r);
      var l = B(r, 2),
        u = z(l),
        d = z(u),
        f = B(z(d), 2);
      (bi(f), M(d));
      var p = B(d, 2),
        m = B(z(p), 2);
      (bi(m), M(p), M(u));
      var h = B(u, 2),
        g = z(h),
        _ = B(g, 2),
        v = z(_, !0);
      (M(_),
        M(h),
        M(l),
        M(n),
        M(t),
        V(() => {
          ((f.disabled = W(c)),
            (m.disabled = W(c)),
            (g.disabled = W(c)),
            (_.disabled = W(c)),
            J(v, W(c) ? `创建中...` : `创建用户`));
        }),
        G(`click`, t, (e) => {
          e.target === e.currentTarget && R(a, !1);
        }),
        G(`click`, i, () => R(a, !1)),
        Er(`submit`, l, y),
        Ti(
          f,
          () => W(o),
          (e) => R(o, e),
        ),
        Ti(
          m,
          () => W(s),
          (e) => R(s, e),
        ),
        G(`click`, g, () => R(a, !1)),
        q(e, t));
    };
  (Y(Te, (e) => {
    W(a) && e(Ee);
  }),
    V(() => {
      (J(ne, W(p)),
        X(re, 1, `stats-card ${W(h) > 0 ? `highlight` : ``}`),
        fi(ie, W(h) > 0 ? `color: var(--accent-ochre);` : ``),
        J(ae, W(h)),
        J(O, W(m)),
        X(pe, 1, `filter-pill ${W(u) === `all` ? `active` : ``}`),
        X(me, 1, `filter-pill ${W(u) === `active` ? `active` : ``}`),
        X(he, 1, `filter-pill ${W(u) === `inactive` ? `active` : ``}`),
        J(be, `共计 ${W(g).length ?? ``} 项`));
    }),
    Ti(
      de,
      () => W(l),
      (e) => R(l, e),
    ),
    G(`click`, pe, () => R(u, `all`)),
    G(`click`, me, () => R(u, `active`)),
    G(`click`, he, () => R(u, `inactive`)),
    G(`click`, _e, () => R(a, !0)),
    q(e, x),
    Ge());
}
Dr([`click`]);
var _l = K(
    `<button class="floating-chat-trigger svelte-1lsysha" title="打开智能助手" aria-label="打开智能助手"><div class="trigger-ring svelte-1lsysha"><svg class="trigger-svg svelte-1lsysha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" class="svelte-1lsysha"></path><path d="M8 10h.01M12 10h.01M16 10h.01" class="svelte-1lsysha"></path></svg></div> <span class="trigger-badge svelte-1lsysha">AI</span></button>`,
  ),
  vl = K(
    `<button class="header-icon-btn svelte-1lsysha" title="返回对话"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><path d="m15 18-6-6 6-6" class="svelte-1lsysha"></path></svg></button>`,
  ),
  yl = K(
    `<button class="header-icon-btn svelte-1lsysha" title="会话列表"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><line x1="3" x2="21" y1="6" y2="6" class="svelte-1lsysha"></line><line x1="3" x2="21" y1="12" y2="12" class="svelte-1lsysha"></line><line x1="3" x2="21" y1="18" y2="18" class="svelte-1lsysha"></line></svg></button>`,
  ),
  bl = K(
    `<button class="header-icon-btn svelte-1lsysha" title="开启新对话"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><path d="M5 12h14" class="svelte-1lsysha"></path><path d="M12 5v14" class="svelte-1lsysha"></path></svg></button>`,
  ),
  xl = K(
    `<div class="widget-blocked svelte-1lsysha"><span class="blocked-lock svelte-1lsysha">🔒</span> <h4 class="svelte-1lsysha">智能助手已锁定</h4> <p class="svelte-1lsysha">您的账户尚未激活，请联系管理员激活以启用智能对话能力。</p></div>`,
  ),
  Sl = K(`<div class="widget-loading svelte-1lsysha">载入会话列表中...</div>`),
  Cl = K(`<div class="widget-empty svelte-1lsysha">没有历史会话记录</div>`),
  wl = K(
    `<div><div class="session-card-info svelte-1lsysha"><div class="session-card-title svelte-1lsysha"> </div> <div class="session-card-meta svelte-1lsysha"><span class="svelte-1lsysha"> </span></div></div> <button class="session-delete-btn svelte-1lsysha" title="删除会话" aria-label="删除会话">🗑️</button></div>`,
  ),
  Tl = K(`<div class="sessions-grid svelte-1lsysha"></div>`),
  El = K(
    `<div class="sessions-pane svelte-1lsysha"><div class="sessions-header svelte-1lsysha"><button class="widget-btn primary svelte-1lsysha" style="width: 100%;">+ 开启新的对话</button></div> <div class="sessions-list-scroll svelte-1lsysha"><!></div></div>`,
  ),
  Dl = K(
    `<div class="widget-loading svelte-1lsysha">正在提取聊天记录...</div>`,
  ),
  Ol = K(
    `<div class="chat-welcome svelte-1lsysha"><span class="welcome-avatar svelte-1lsysha">📚</span> <h3 class="svelte-1lsysha">Knovana AI 智能助手</h3> <p class="svelte-1lsysha">您可以问我关于知识库整理、Markdown格式优化、专题归纳的任何问题，我会竭诚为您提供分析和编写服务。</p></div>`,
  ),
  kl = K(
    `<details class="thinking-details svelte-1lsysha"><summary class="svelte-1lsysha">🧠 推理思考过程</summary> <pre class="thinking-text svelte-1lsysha"> </pre></details>`,
  ),
  Al = K(
    `<p style="white-space: pre-wrap; margin: 0;" class="svelte-1lsysha"> </p>`,
  ),
  jl = K(`<div class="markdown-rich-content svelte-1lsysha"></div>`),
  Ml = K(
    `<div><div class="message-avatar svelte-1lsysha"> </div> <div class="message-content-wrapper svelte-1lsysha"><!> <div class="message-bubble svelte-1lsysha"><!></div></div></div>`,
  ),
  Nl = K(`<div class="messages-list svelte-1lsysha"></div>`),
  Pl = K(
    `<div class="status-indicator svelte-1lsysha"><span class="pulse-icon svelte-1lsysha">●</span> <span class="status-msg svelte-1lsysha"> </span></div>`,
  ),
  Fl = K(
    `<button class="widget-btn-small svelte-1lsysha">🔄 重新生成</button>`,
  ),
  Il = K(
    `<div class="chat-pane svelte-1lsysha"><div class="chat-messages-container svelte-1lsysha"><!></div> <div class="composer-container svelte-1lsysha"><div class="composer-card svelte-1lsysha"><textarea class="composer-textarea svelte-1lsysha" placeholder="向 Knovana 提问..."></textarea> <div class="composer-toolbar svelte-1lsysha"><div class="toolbar-left svelte-1lsysha"><!></div> <div class="toolbar-right svelte-1lsysha"><button class="widget-send-btn svelte-1lsysha" title="发送" aria-label="发送"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><path d="m22 2-7 20-4-9-9-4Z" class="svelte-1lsysha"></path><path d="M22 2 11 13" class="svelte-1lsysha"></path></svg></button></div></div></div></div></div>`,
  ),
  Ll = K(
    `<div class="widget-window svelte-1lsysha"><div class="notebook-margin-line svelte-1lsysha"></div>  <div class="resize-handle-tl svelte-1lsysha" title="缩放 (左上角)"><svg viewBox="0 0 100 100" class="resize-handle-svg svelte-1lsysha"><line x1="100" y1="0" x2="0" y2="100" stroke="#b25a38" stroke-width="15" class="svelte-1lsysha"></line></svg></div>  <div class="resize-handle-br svelte-1lsysha" title="缩放 (右下角)"><svg viewBox="0 0 100 100" class="resize-handle-svg-br svelte-1lsysha"><line x1="0" y1="100" x2="100" y2="0" stroke="#b25a38" stroke-width="15" class="svelte-1lsysha"></line></svg></div>  <div class="widget-header svelte-1lsysha"><div class="header-left svelte-1lsysha"><!> <span class="header-title svelte-1lsysha"> </span></div> <div class="header-right svelte-1lsysha"><!> <button class="header-icon-btn close svelte-1lsysha" title="最小化"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="svelte-1lsysha"><line x1="18" x2="6" y1="6" y2="18" class="svelte-1lsysha"></line><line x1="6" x2="18" y1="6" y2="18" class="svelte-1lsysha"></line></svg></button></div></div> <div class="widget-body svelte-1lsysha"><!></div></div>`,
  ),
  Rl = K(`<div class="knovana-chat-container svelte-1lsysha"><!></div>`),
  zl = {
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
function Bl(e, t) {
  (We(t, !0), ni(e, zl));
  let n = Ai(t, `apiUrl`, 7, `http://localhost:8000`),
    r = Ai(t, `token`, 7, ``),
    i = Ai(t, `isBlocked`, 7, !1),
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
    W(b) && (await gr(), (W(b).scrollTop = W(b).scrollHeight));
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
  async function w(e, t) {
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
  async function T() {
    if (!i()) {
      R(y, !0);
      try {
        (R(
          d,
          (await C(`GET`, `/api/v1/chat/sessions?page=1&per_page=50`))
            .sessions || [],
          !0,
        ),
          !W(f) && W(d).length > 0 && E(W(d)[0].id));
      } catch (e) {
        console.error(`Failed to load sessions`, e);
      } finally {
        R(y, !1);
      }
    }
  }
  async function ee() {
    if (!i()) {
      (R(g, !1), R(_, ``));
      try {
        let e = await C(`POST`, `/api/v1/chat/sessions`, { title: `新对话` });
        (R(f, e.id, !0),
          R(m, e.title || `新对话`, !0),
          R(p, [], !0),
          R(o, !1),
          await T());
      } catch (e) {
        console.error(`Failed to create session`, e);
      }
    }
  }
  async function E(e) {
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
  async function te(e, t) {
    if ((t.stopPropagation(), confirm(`确定要删除该对话会话吗？`)))
      try {
        (await C(`DELETE`, `/api/v1/chat/sessions/${e}`),
          W(f) === e && (R(f, null), R(p, [], !0), R(m, `智能会话`)),
          await T());
      } catch (e) {
        console.error(`Failed to delete session`, e);
      }
  }
  async function D() {
    if (!W(h).trim() || W(g) || i()) return;
    let e = W(h).trim();
    R(h, ``);
    let t = `msg_user_${Date.now()}`;
    (R(
      p,
      [
        ...W(p),
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
      W(f) && (t.session_id = W(f));
      let i = r() ? `Bearer ${r()}` : ``,
        l = await fetch(`${n()}/api/v1/chat`, {
          method: `POST`,
          headers: { "Content-Type": `application/json`, Authorization: i },
          body: JSON.stringify(t),
        });
      if (!l.ok) throw Error(`Server returned HTTP ${l.status}`);
      await w(l, (e) => {
        if (e.type === `message_start`)
          ((a = e.message?.id),
            R(
              p,
              [
                ...W(p),
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
          W(f) || (R(f, e.session_id, !0), T());
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
      (R(g, !1), await T());
    }
    function s() {
      let e = o
          .filter((e) => e && e.type === `text` && e.text)
          .map((e) => e.text)
          .join(``),
        t = W(p).findIndex((e) => e.id === a);
      t !== -1 && ((W(p)[t].content = e), R(p, [...W(p)], !0), S());
    }
    function c() {
      let e = o
          .filter((e) => e && e.type === `thinking` && e.text)
          .map((e) => e.text)
          .join(``),
        t = W(p).findIndex((e) => e.id === a);
      t !== -1 && ((W(p)[t].thinking = e), R(p, [...W(p)], !0), S());
    }
  }
  async function ne() {
    if (!W(f) || W(g) || i()) return;
    (R(g, !0), R(_, `正在重新思考...`));
    let e = W(p)[W(p).length - 1];
    e && e.role === `assistant` && R(p, W(p).slice(0, -1), !0);
    let t = ``,
      a = [];
    try {
      let e = r() ? `Bearer ${r()}` : ``,
        i = await fetch(`${n()}/api/v1/chat/regenerate`, {
          method: `POST`,
          headers: { "Content-Type": `application/json`, Authorization: e },
          body: JSON.stringify({ session_id: W(f) }),
        });
      if (!i.ok) throw Error(`Server returned HTTP ${i.status}`);
      await w(i, (e) => {
        if (e.type === `message_start`)
          ((t = e.message?.id),
            R(
              p,
              [
                ...W(p),
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
        n = W(p).findIndex((e) => e.id === t);
      n !== -1 && ((W(p)[n].content = e), R(p, [...W(p)], !0), S());
    }
    function s() {
      let e = a
          .filter((e) => e && e.type === `thinking` && e.text)
          .map((e) => e.text)
          .join(``),
        n = W(p).findIndex((e) => e.id === t);
      n !== -1 && ((W(p)[n].thinking = e), R(p, [...W(p)], !0), S());
    }
  }
  function re(e) {
    if (W(a)) return;
    let t = e.target;
    if (
      t.closest(`button`) ||
      t.closest(`input`) ||
      t.closest(`textarea`) ||
      t.closest(`.resize-handle-tl`) ||
      t.closest(`.resize-handle-br`) ||
      (e.preventDefault(), !W(x))
    )
      return;
    let n = W(x).getBoundingClientRect();
    (W(l) === null || W(u) === null) && (R(l, n.left, !0), R(u, n.top, !0));
    let r = e.clientX,
      i = e.clientY,
      o = W(l),
      d = W(u);
    function f(e) {
      let t = e.clientX - r,
        n = e.clientY - i;
      (R(l, Math.max(0, Math.min(window.innerWidth - W(s), o + t)), !0),
        R(u, Math.max(0, Math.min(window.innerHeight - W(c), d + n)), !0));
    }
    function p() {
      (window.removeEventListener(`mousemove`, f),
        window.removeEventListener(`mouseup`, p));
    }
    (window.addEventListener(`mousemove`, f),
      window.addEventListener(`mouseup`, p));
  }
  function ie(e) {
    if ((e.preventDefault(), e.stopPropagation(), !W(x))) return;
    let t = W(x).getBoundingClientRect(),
      n = W(l) === null || W(u) === null,
      r = e.clientX,
      i = e.clientY,
      a = W(s),
      o = W(c),
      d = n ? t.left : W(l),
      f = n ? t.top : W(u);
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
  function ae(e) {
    if ((e.preventDefault(), e.stopPropagation(), !W(x))) return;
    let t = W(x).getBoundingClientRect();
    (W(l) === null || W(u) === null) && (R(l, t.left, !0), R(u, t.top, !0));
    let n = e.clientX,
      r = e.clientY,
      i = W(s),
      a = W(c);
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
  function oe(e) {
    if (!e) return ``;
    try {
      let t = Q.parse(e);
      return tc.sanitize(t);
    } catch {
      return e;
    }
  }
  function se() {
    return W(p).length === 0 ? !1 : W(p)[W(p).length - 1].role === `assistant`;
  }
  function O() {
    (R(a, !W(a)), !W(a) && W(d).length === 0 && T(), S());
  }
  Li(() => {
    !i() && r() && T();
  });
  var ce = {
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
    le = Rl(),
    ue = z(le),
    de = (e) => {
      var t = _l();
      (G(`click`, t, O), q(e, t));
    },
    fe = (e) => {
      var t = Ll(),
        n = B(z(t), 2),
        r = B(n, 2),
        a = B(r, 2),
        S = z(a),
        C = z(S),
        w = (e) => {
          var t = vl();
          (G(`click`, t, () => R(o, !1)), q(e, t));
        },
        ce = (e) => {
          var t = yl();
          (G(`click`, t, () => {
            (R(o, !0), T());
          }),
            q(e, t));
        };
      Y(C, (e) => {
        W(o) ? e(w) : e(ce, -1);
      });
      var le = B(C, 2),
        ue = z(le, !0);
      (M(le), M(S));
      var de = B(S, 2),
        fe = z(de),
        pe = (e) => {
          var t = bl();
          (G(`click`, t, ee), q(e, t));
        };
      Y(fe, (e) => {
        W(o) || e(pe);
      });
      var me = B(fe, 2);
      (M(de), M(a));
      var he = B(a, 2),
        ge = z(he),
        _e = (e) => {
          q(e, xl());
        },
        ve = (e) => {
          var t = El(),
            n = z(t),
            r = z(n);
          M(n);
          var i = B(n, 2),
            a = z(i),
            o = (e) => {
              q(e, Sl());
            },
            s = (e) => {
              q(e, Cl());
            },
            c = (e) => {
              var t = Tl();
              (Yr(
                t,
                21,
                () => W(d),
                Gr,
                (e, t) => {
                  var n = wl();
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
                    V(() => {
                      ((r = X(
                        n,
                        1,
                        `session-item-card svelte-1lsysha`,
                        null,
                        r,
                        { selected: W(f) === W(t).id },
                      )),
                        J(o, W(t).title || `无标题会话`),
                        J(l, `💬 ${(W(t).message_count || 0) ?? ``} 条消息`));
                    }),
                    G(`click`, n, () => E(W(t).id)),
                    G(`click`, u, (e) => te(W(t).id, e)),
                    q(e, n));
                },
              ),
                M(t),
                q(e, t));
            };
          (Y(a, (e) => {
            W(y) ? e(o) : W(d).length === 0 ? e(s, 1) : e(c, -1);
          }),
            M(i),
            M(t),
            G(`click`, r, ee),
            q(e, t));
        },
        k = (e) => {
          var t = Il(),
            n = z(t),
            r = z(n),
            i = (e) => {
              q(e, Dl());
            },
            a = (e) => {
              q(e, Ol());
            },
            o = (e) => {
              var t = Nl();
              (Yr(
                t,
                21,
                () => W(p),
                Gr,
                (e, t) => {
                  var n = Ml(),
                    r = z(n),
                    i = z(r, !0);
                  M(r);
                  var a = B(r, 2),
                    o = z(a),
                    s = (e) => {
                      var n = kl(),
                        r = B(z(n), 2),
                        i = z(r, !0);
                      (M(r),
                        M(n),
                        V(() => {
                          ((n.open =
                            W(g) && W(p)[W(p).length - 1].id === W(t).id),
                            J(i, W(t).thinking));
                        }),
                        q(e, n));
                    };
                  Y(o, (e) => {
                    W(t).role === `assistant` && W(t).thinking && e(s);
                  });
                  var c = B(o, 2),
                    l = z(c),
                    u = (e) => {
                      var n = Al(),
                        r = z(n, !0);
                      (M(n), V(() => J(r, W(t).content)), q(e, n));
                    },
                    d = (e) => {
                      var n = jl();
                      (ti(n, () => oe(W(t).content), !0), M(n), q(e, n));
                    };
                  (Y(l, (e) => {
                    W(t).role === `user` ? e(u) : e(d, -1);
                  }),
                    M(c),
                    M(a),
                    M(n),
                    V(() => {
                      (X(
                        n,
                        1,
                        `message-row ${W(t).role ?? ``}`,
                        `svelte-1lsysha`,
                      ),
                        J(i, W(t).role === `user` ? `👤` : `🤖`));
                    }),
                    q(e, n));
                },
              ),
                M(t),
                q(e, t));
            };
          (Y(r, (e) => {
            W(v) ? e(i) : W(p).length === 0 ? e(a, 1) : e(o, -1);
          }),
            M(n),
            ki(
              n,
              (e) => R(b, e),
              () => W(b),
            ));
          var s = B(n, 2),
            c = z(s),
            l = z(c);
          gn(l);
          var u = B(l, 2),
            d = z(u),
            f = z(d),
            m = (e) => {
              var t = Pl(),
                n = B(z(t), 2),
                r = z(n, !0);
              (M(n), M(t), V(() => J(r, W(_))), q(e, t));
            },
            y = (e) => {
              var t = Fl();
              (G(`click`, t, ne), q(e, t));
            },
            x = F(() => se() && !W(g));
          (Y(f, (e) => {
            W(_) ? e(m) : W(x) && e(y, 1);
          }),
            M(d));
          var S = B(d, 2),
            C = z(S);
          (M(S),
            M(u),
            M(c),
            M(s),
            M(t),
            V(
              (e) => {
                ((l.disabled = W(g)), (C.disabled = e));
              },
              [() => W(g) || !W(h).trim()],
            ),
            G(`keydown`, l, (e) => {
              e.key === `Enter` && !e.shiftKey && (e.preventDefault(), D());
            }),
            Ti(
              l,
              () => W(h),
              (e) => R(h, e),
            ),
            G(`click`, C, D),
            q(e, t));
        };
      (Y(ge, (e) => {
        i() ? e(_e) : W(o) ? e(ve, 1) : e(k, -1);
      }),
        M(he),
        M(t),
        ki(
          t,
          (e) => R(x, e),
          () => W(x),
        ),
        V(() => {
          (fi(
            t,
            `width: ${W(s) ?? ``}px; height: ${W(c) ?? ``}px; left: ${W(l) === null ? `auto` : W(l) + `px`}; top: ${W(u) === null ? `auto` : W(u) + `px`};`,
          ),
            xi(le, `title`, W(o) ? `会话列表` : W(m)),
            J(ue, W(o) ? `历史会话` : W(m)));
        }),
        G(`mousedown`, n, ie),
        G(`mousedown`, r, ae),
        G(`mousedown`, a, re),
        G(`click`, me, O),
        q(e, t));
    };
  return (
    Y(ue, (e) => {
      W(a) ? e(de) : e(fe, -1);
    }),
    M(le),
    q(e, le),
    Ge(ce)
  );
}
(Dr([`click`, `mousedown`, `keydown`]),
  customElements.define(
    `knovana-chat-widget`,
    Ii(Bl, { apiUrl: {}, token: {}, isBlocked: {} }, [], [], { mode: `open` }),
  ));
var Vl = K(
    `<div class="app-loading svelte-1n46o8q"><div class="spinner svelte-1n46o8q">📚</div> <p>正在拉取控制台配置...</p></div>`,
  ),
  Hl = K(
    `<div class="unauthorized-state svelte-1n46o8q"><h3 class="svelte-1n46o8q">🚫 访问受限</h3> <p>您无权查看此页面，或者页面不存在。</p></div>`,
  ),
  Ul = K(`<div><!> <main class="content-pane"><!></main></div> <!>`, 1);
function Wl(e, t) {
  We(t, !0);
  let n = L(!0),
    r = L(!1),
    i = L(``),
    a = L(`inactive`),
    o = L(!1),
    s = L(`knowledge`),
    c = L(!1);
  async function l() {
    if (!Hi()) {
      (R(r, !1), R(n, !1));
      return;
    }
    R(n, !0);
    try {
      let e = await Gi(`/api/v1/auth/me`);
      e.error
        ? (Wi(), R(r, !1))
        : e.data &&
          (R(i, e.data.username, !0),
          R(a, e.data.status, !0),
          R(o, e.data.is_admin, !0),
          R(r, !0));
    } finally {
      R(n, !1);
    }
  }
  function u() {
    (Wi(), R(r, !1), R(i, ``), R(a, `inactive`), R(o, !1), R(s, `knowledge`));
  }
  function d(e) {
    R(s, e, !0);
  }
  Li(() => {
    l();
  });
  var f = Lr(),
    p = dn(f),
    m = (e) => {
      q(e, Vl());
    },
    h = (e) => {
      Yi(e, { onSuccess: l });
    },
    g = (e) => {
      var t = Ul(),
        n = dn(t),
        r = z(n);
      sa(r, {
        get activeTab() {
          return W(s);
        },
        get isAdmin() {
          return W(o);
        },
        get username() {
          return W(i);
        },
        get status() {
          return W(a);
        },
        get isCollapsed() {
          return W(c);
        },
        onToggleCollapse: () => R(c, !W(c)),
        onTabChange: d,
        onLogout: u,
      });
      var l = B(r, 2),
        f = z(l),
        p = (e) => {
          {
            let t = F(() => W(a) !== `active` && !W(o));
            Ic(e, {
              get isBlocked() {
                return W(t);
              },
            });
          }
        },
        m = (e) => {
          {
            let t = F(() => W(a) !== `active` && !W(o));
            nl(e, {
              get isAdmin() {
                return W(o);
              },
              get isBlocked() {
                return W(t);
              },
            });
          }
        },
        h = (e) => {
          gl(e, {
            get currentAdminUsername() {
              return W(i);
            },
          });
        },
        g = (e) => {
          q(e, Hl());
        };
      (Y(f, (e) => {
        W(s) === `knowledge`
          ? e(p)
          : W(s) === `keys`
            ? e(m, 1)
            : W(s) === `users` && W(o)
              ? e(h, 2)
              : e(g, -1);
      }),
        M(l),
        M(n));
      var _ = B(n, 2);
      {
        let e = F(Bi),
          t = F(() => Hi() || ``),
          n = F(() => W(a) !== `active` && !W(o));
        Bl(_, {
          get apiUrl() {
            return W(e);
          },
          get token() {
            return W(t);
          },
          get isBlocked() {
            return W(n);
          },
        });
      }
      (V(() => X(n, 1, `dashboard-layout ${W(c) ? `collapsed` : ``}`)),
        q(e, t));
    };
  (Y(p, (e) => {
    W(n) ? e(m) : W(r) ? e(g, -1) : e(h, 1);
  }),
    q(e, f),
    Ge());
}
Rr(Wl, { target: document.getElementById(`app`) });
