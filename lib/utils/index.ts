import { SwaggerAttribute, SwaggerAction } from '../interfaces';
import swaggerJSDoc from 'swagger-jsdoc';
import cloneDeep from 'lodash/cloneDeep';
import { OpenApi } from '../../types/openapi';
import uniqByLodash from 'lodash/uniqBy';
import mapKeys from 'lodash/mapKeys';
import get from 'lodash/get';
import uniq from 'lodash/uniq';

const uniqBy = uniqByLodash as unknown as <T>(array: Array<T>, prop: string) => Array<T>



const componentReference: Array<keyof OpenApi.Components> = [
    "schemas",
    "parameters",
    "securitySchemes",
    "requestBodies",
    "responses",
    "headers",
    "examples",
    "links",
    "callbacks"
  ]

export const mergeSwaggerSpec = (destination: SwaggerAttribute, source: SwaggerAttribute): SwaggerAttribute => {
    const dest: SwaggerAttribute = cloneDeep(destination)
    dest.tags = uniqBy([
      ...(get(source, 'tags', [])),
      ...(get(dest, 'tags', [])),
    ], 'name');
  
    dest.components = componentReference.reduce((mergedComponents, ref) => {
      const type = get(source, `components.${ref}`);
      if (type) {
        mergedComponents[ref] = {
          ...(get(dest.components, ref, {})),
          ...type
        }
      }
      return mergedComponents
    }, dest.components || {})
    return dest
  }
  
  export const mergeSwaggerPaths = (dest: SwaggerAction | undefined, sourcePaths: SwaggerAction): SwaggerAction => {
    // strip off leading '/' from both source and destination swagger action, swagger-doc returns paths with leading /path-name: {}
    const swaggerActions = mapKeys(cloneDeep(dest || {}), (_, key) => key.replace(/^\//, ''));
    const paths = mapKeys(cloneDeep(sourcePaths), (_, key) => key.replace(/^\//, ''));
    // unique action keys
    const actions = uniq(Object.keys(swaggerActions).concat(Object.keys(paths)))
    return actions.reduce((merged, key) => {
      const destination = swaggerActions[key];
      const source = paths[key];
      merged[key] = {
        ...(destination || {}),
        ...(source || {})
      }
      return merged
    }, {} as SwaggerAction)
  }
  
  export const loadSwaggerDocComments = (filePath: string): Promise<OpenApi.OpenApi>=> {
    return new Promise((resolve, reject) => {
      try {
        const opts = {
          definition: {
            openapi: '3.0.0', // Specification (optional, defaults to swagger: '2.0')
            info: { title: 'dummy', version: '0.0.0' },
          },
          apis: [filePath],
        };
        const specification = swaggerJSDoc(opts);
        resolve(specification as OpenApi.OpenApi)
      }catch(err){
        reject(err)
      }
    });
  }
  