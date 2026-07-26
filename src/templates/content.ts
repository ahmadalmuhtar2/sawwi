// Shared helpers for reading/writing a template's editable data (a plain nested
// JSON object) by dot-path, and merging user overrides onto the defaults. Used
// by the onboarding wizard, the content editor, and the renderer.

type Json = Record<string, unknown>;

function isObject(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Read a dot-path (e.g. "shop.name") from a nested object. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    return isObject(acc) ? acc[k] : undefined;
  }, obj);
}

/** Return a NEW object with `path` set to `value` (immutable; creates parents). */
export function setPath(obj: Json, path: string, value: unknown): Json {
  const keys = path.split(".");
  const [head, ...rest] = keys;
  const next: Json = { ...obj };
  if (rest.length === 0) {
    next[head] = value;
  } else {
    const child = isObject(next[head]) ? (next[head] as Json) : {};
    next[head] = setPath(child, rest.join("."), value);
  }
  return next;
}

/** Deep-merge `override` onto `base` (arrays and primitives replace wholesale;
 *  objects merge key-by-key). Used to render defaults ⊕ saved content. */
export function deepMerge<T extends Json>(base: T, override: unknown): T {
  if (!isObject(override)) return base;
  const out: Json = { ...base };
  for (const [k, v] of Object.entries(override)) {
    out[k] = isObject(v) && isObject(out[k]) ? deepMerge(out[k] as Json, v) : v;
  }
  return out as T;
}
