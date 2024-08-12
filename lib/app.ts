import { IComponentInstance } from "./component";

declare global {
    interface Window {
        [key: string]: any
    }
}

export interface IApp {
    name: string;
    $mount: (component: IComponentInstance) => void;
    $unmount: () => void;
    $destroy: () => void;
    instances: IComponentInstance[];
}

export const useApp = (node: HTMLElement, name: string): IApp => {
    const ref = node
    const instances : IComponentInstance[] = [];

    const mountComponent = (component: IComponentInstance) => {
        ref.appendChild(component.parsedTemplate)
        window[name] = component
        instances.push(component)
    }

    return {
        name,
        $mount: mountComponent,
        $unmount: () => {
            ref.innerHTML = ""
        },
        $destroy: () => {
            ref.innerHTML = ""
            instances.forEach((instance) => {
                instance.parsedTemplate.innerHTML = ""
            })
        },
        instances
    }
}



export default useApp