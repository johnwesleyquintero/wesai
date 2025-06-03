
import React, { useState, useEffect, useRef, useId } from 'react';

// Ensure Babel is available on the window object
declare global {
  interface Window {
    Babel: any;
  }
}

// Simple Error Boundary
class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode, onErrorRender?: (error: Error) => React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error rendering preview:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.onErrorRender && this.state.error) {
        return this.props.onErrorRender(this.state.error);
      }
      return (
        <div className="p-2 text-red-500 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
          <p className="font-semibold text-sm">Preview Error:</p>
          <pre className="text-xs whitespace-pre-wrap mt-1">{this.state.error?.message || 'Unknown error'}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ReactPreviewRendererProps {
  code: string;
}

export const ReactPreviewRenderer: React.FC<ReactPreviewRendererProps> = ({ code }) => {
  const [ComponentToRender, setComponentToRender] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transpiledCodeForDebug, setTranspiledCodeForDebug] = useState<string | null>(null);
  const uniqueId = useId(); 

  useEffect(() => {
    setComponentToRender(null);
    setError(null);
    setTranspiledCodeForDebug(null); // Initialize here

    if (!code) {
      setError("No code provided for preview.");
      return;
    }

    if (typeof window.Babel === 'undefined') {
        setError("Babel is not available for transpilation. Ensure it's loaded.");
        console.error("Babel not found on window object.");
        return;
    }

    let currentTranspiledCode: string | null = null; // Local variable for debugging in catch

    try {
      const transformed = window.Babel.transform(code, {
        presets: [
          ['env', { 
            modules: 'commonjs', 
            targets: "defaults"
          }], 
          ['react', { 
            runtime: 'classic' 
          }],
          ['typescript', { allExtensions: true, isTSX: true }]
        ],
        filename: `preview-${uniqueId}.tsx`,
        sourceType: 'module'
      });
      
      const transformedCodeResult = transformed.code;
      currentTranspiledCode = transformedCodeResult; // Assign for potential logging in catch
      setTranspiledCodeForDebug(transformedCodeResult);


      if (!transformedCodeResult) {
        setError("Transpilation failed: No output code generated.");
        return;
      }
      
      const componentFactory = new Function('React', 'require', 'exports', 'module', `
        try {
          ${transformedCodeResult}
        } catch (e) {
          console.error('Error during transpiled code execution:', e);
          throw e; 
        }
      `);
      
      const R = React; 
      const mockRequire = (name: string) => {
        if (name === 'react') return R;
        console.warn(`Preview component tried to require: '${name}'. Mocking an empty object.`);
        return {}; 
      };
      const exportsObj: { default?: any } = {}; 
      const moduleObj = { exports: exportsObj };

      componentFactory(R, mockRequire, exportsObj, moduleObj);
      
      const CompCandidate = moduleObj.exports.default || moduleObj.exports;

      if (typeof CompCandidate === 'function') {
        setComponentToRender(CompCandidate as React.ComponentType);
      } else if (React.isValidElement(CompCandidate)) {
        const ElementRenderer: React.FC = () => CompCandidate;
        setComponentToRender(ElementRenderer);
      } else {
        console.error("Preview: Transpiled code did not yield a usable React component or element.", CompCandidate, moduleObj.exports);
        setError("Could not render component: The transpiled code did not export a recognizable React component or function, nor a valid React element. Ensure a default export or direct module.exports assignment for your component or element.");
      }

    } catch (e: any) {
      console.error("Error transforming or evaluating preview code:", e);
      setError(`Preview Error: ${e.message}. Check console for more details.`);
      if (e.stack) {
        console.error(e.stack);
      }
      if (currentTranspiledCode) { 
        console.log("Transpiled code (debug on error):\n", currentTranspiledCode);
      }
    }
  }, [code, uniqueId]); // Corrected dependency array

  const renderErrorState = (caughtError: Error) => (
    <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-600">
      <strong className="font-semibold">Component Preview Error:</strong>
      <p className="mt-1 text-xs whitespace-pre-wrap">{caughtError.message}</p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">The component code caused an error during rendering. Check the console for details.</p>
    </div>
  );

  if (error) {
    return renderErrorState(new Error(error));
  }

  if (!ComponentToRender) {
    return (
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
        Loading preview...
      </div>
    );
  }

  return (
    <PreviewErrorBoundary onErrorRender={renderErrorState}>
      <div className="p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white min-h-[50px]">
        <ComponentToRender />
      </div>
    </PreviewErrorBoundary>
  );
};
