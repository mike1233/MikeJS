type ComponentState = Record<string | symbol, any>;

export interface IComponent<T = ComponentState> {
  name: string;
  state: T;
  methods: () => Record<string | symbol, (this: T) => any>;
  calculated: () => Record<string | symbol, (this: T) => any>;
  render: () => string;
  beforeStart?: (this: T) => void | Promise<void>;
  afterStart?: (this: T) => void | Promise<void>;
  children?: IComponent[];
}

export interface IComponentInstance {
  parsedTemplate: HTMLElement;
  state: ComponentState;
  methods?: Record<string | symbol, (...args: any[]) => void>;
  instanceId?: string;
}

export const useComponent = <T extends object = ComponentState>(
  component: IComponent<T>
): IComponentInstance => {
  const parser = new DOMParser();
  const template = parser.parseFromString(component.render(), "text/html").body;
  template.id = component.name;

  const vDOM = template.cloneNode(true) as HTMLElement;
  const nodes = [] as { node: Text; key: string }[];

  const methods = component.methods();

  const state = new Proxy(component.state, {
    get: (target, key) => {
      return target[key as keyof T];
    },
    set: (target, key, value) => {
      try {
        target[key as keyof T] = value;
        onStateChange(key, value);
        trackCalculatedProperties();
        return true;
      } catch (e) {
        throw new Error(String(e));
      }
    },
  });

  const onStateChange = (key: symbol | string, value: any) => {
    const treeWalker = document.createTreeWalker(
      vDOM,
      NodeFilter.SHOW_TEXT,
      null
    );

    while (treeWalker.nextNode()) {
      const node = treeWalker.currentNode as Text;
      const regexForKey = new RegExp(`{{${String(key)}}}`, "g");
      const matches = node.nodeValue?.match(regexForKey);

      if (!matches) continue;

      matches.forEach(() => {
        if (node.nodeValue === null) return;
        nodes.push({ node, key: String(key) });
      });
    }

    nodes.forEach((entry) => {
      if (entry.node.nodeValue === null) return;
      if (entry.key !== key) return;

      entry.node.nodeValue = value;
    });
  };

  const parseComponentState = () => {
    for (const key in state) {
      onStateChange(key, state[key]);
    }
  };

  const bindEventListeners = () => {
    const LISTENERS = {
      "data-click": "click",
    } as const;

    for (const k in LISTENERS) {
      const key = k as keyof typeof LISTENERS;
      const listener = LISTENERS[key];

      const elements = vDOM.querySelectorAll(`[${key}]`);

      elements.forEach((element) => {
        const methodName = element.getAttribute(key);
        const method = methods[methodName as string];

        if (!method) return;

        element.addEventListener(listener, () => {
          method.call(state);
        });
      });
    }
  };

  const trackCalculatedProperties = () => {
    const calculated = component.calculated();

    for (const key in calculated) {
      const val = calculated[key as keyof typeof calculated].call(state);
      const existingVal = state[key as keyof T];

      if (val === undefined) return;
      if (existingVal === val) return;

      state[key as keyof T] = val;
    }
  };

  if (component.beforeStart) {
    component.beforeStart.call(state);
  }

  parseComponentState();
  bindEventListeners();
  trackCalculatedProperties();

  if (component.afterStart) {
    component.afterStart.call(state);
  }

  return {
    instanceId: component.name + "-" + new Date().getTime(),
    state: state,
    //methods: component.methods,
    parsedTemplate: vDOM,
  };
};

export default useComponent;
