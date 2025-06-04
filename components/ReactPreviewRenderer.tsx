import React, { useState, useEffect, useId, ReactNode, ReactElement, ComponentType } from 'react';

// Ensure Babel is available on the window object for in-browser transpilation
// Note: Relying on global `window.Babel` requires Babel to be loaded externally.
declare global {
  interface Window {
    Babel: {
      transform: (code: string, options: any) => { code: string | null };
    };
  }
}

// Simple Error Boundary component to catch rendering errors within the preview
class PreviewErrorBoundary extends React.Component<
  { children: ReactNode; onErrorRender?: (error: unknown) => ReactNode },
  { hasError: boolean; error: unknown }
> {
  constructor(props: { children: ReactNode; onErrorRender?: (error: unknown) => ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // Use unknown for error type here as it can be anything thrown
  static getDerivedStateFromError(error: unknown) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to the console
    console.error('Preview Error Boundary caught a rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // If an onErrorRender prop is provided, use it to render the error state
      // Pass the actual error object to the custom render function
      if (this.props.onErrorRender) {
        return this.props.onErrorRender(this.state.error);
      }
      // Otherwise, render a default error message
      const errorMessage =
        this.state.error instanceof Error
          ? this.state.error.message
          : typeof this.state.error === 'string'
            ? this.state.error
            : 'An unknown rendering error occurred.';

      return (
        <div className="p-2 text-red-500 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
          <p className="font-semibold text-sm">Preview Error:</p>
          <pre className="text-xs whitespace-pre-wrap mt-1">{errorMessage}</pre>
        </div>
      );
    }
    // Render children normally if no error
    return this.props.children;
  }
}

interface ReactPreviewRendererProps {
  /** The TypeScript/TSX/JavaScript code string to transpile and render. */
  code: string;
  /** Optional function to render a custom error state (transpilation, evaluation, or rendering). */
  onErrorRender?: (error: unknown) => ReactNode;
  /** Optional function to render a loading state. */
  onLoadingRender?: () => ReactNode;
}

// Babel options for transpilation
const babelOptions = {
  presets: [
    // Transpile modern JavaScript/TypeScript down to a compatible version
    [
      'env',
      {
        // Using 'commonjs' modules is necessary for evaluation with `new Function` and a mock `require`
        modules: 'commonjs',
        targets: 'defaults',
      },
    ],
    // Transpile React JSX/TSX
    [
      'react',
      {
        // 'classic' runtime requires `React` to be in scope, which we provide to `new Function`
        runtime: 'classic',
      },
    ],
    // Transpile TypeScript, enabling TSX parsing
    ['typescript', { allExtensions: true, isTSX: true }],
  ],
  // Set source type to 'module' to correctly parse import/export syntax (though we intercept require)
  sourceType: 'module' as const,
};

/**
 * Renders a live preview of React/TSX code by transpiling and evaluating it in the browser.
 * WARNING: EVALUATING ARBITRARY CODE WITH `new Function` IS A SEVERE SECURITY RISK
 * IF THE `code` PROP COMES FROM UNTRUSTED SOURCES. FOR PRODUCTION WITH UNTRUSTED INPUT,
 * USE A SANDBOXED IFRAME OR WEB WORKER.
 */
export const ReactPreviewRenderer: React.FC<ReactPreviewRendererProps> = ({
  code,
  onErrorRender,
  onLoadingRender,
}) => {
  // State to hold the component/element type or wrapper to render
  // React.ElementType can be a string (HTML element), a function, or a class (React component)
  const [ComponentToRender, setComponentToRender] = useState<React.ElementType | null>(null);
  // State to hold errors occurring during transpilation or evaluation (before rendering)
  const [evaluationError, setEvaluationError] = useState<unknown | null>(null);
  // State to hold the transpiled code for debugging if an evaluation error occurs
  const [transpiledCodeForDebug, setTranspiledCodeForDebug] = useState<string | null>(null);

  // useId provides a stable ID unique to this component instance for filename in Babel output
  const uniqueId = useId();

  useEffect(() => {
    // Reset state when the code prop changes to show loading/clear previous error
    setComponentToRender(null);
    setEvaluationError(null);
    setTranspiledCodeForDebug(null);

    if (!code || code.trim() === '') {
      // No code provided, clear preview or show message
      setEvaluationError('No code provided for preview.');
      return;
    }

    // Ensure Babel is loaded before attempting transpilation
    if (typeof window.Babel === 'undefined') {
      const babelError =
        "Babel is not available for transpilation. Ensure it's loaded in the browser environment.";
      console.error(babelError);
      setEvaluationError(babelError);
      return;
    }

    let transpiledCode: string | null = null; // Local variable to hold transpiled code

    try {
      // --- Step 1: Transpile the user's code using Babel ---
      // This runs synchronously and can be CPU-intensive. Consider a Web Worker for performance.
      const transformed = window.Babel.transform(code, {
        ...babelOptions,
        // Use a unique filename for better debugging context in transformed code/errors
        filename: `preview-${uniqueId}.tsx`,
      });

      transpiledCode = transformed.code;
      setTranspiledCodeForDebug(transpiledCode); // Store for potential error logging later

      if (!transpiledCode) {
        // Babel transform might return null without throwing in some edge cases
        throw new Error('Babel transpilation failed: No output code generated.');
      }

      // --- Step 2: Evaluate the transpiled code using new Function ---
      // WARNING: SECURITY RISK - Executes code in the current browser context.
      // Malicious code can access window, document, local storage, etc.
      // ***USE A SANDBOXED IFRAME FOR UNTRUSTED INPUT***

      // Create a function factory to evaluate the code. This allows controlling the scope
      // and injecting necessary globals like React and a mock require.
      const componentFactory = new Function(
        'React', // Inject React
        'require', // Inject mock require
        'exports', // Standard CommonJS export object
        'module', // Standard CommonJS module object
        `
        // Wrap the transpiled code in a try/catch block to catch errors during execution
        try {
          ${transpiledCode}
        } catch (e) {
          console.error('Error executing transpiled preview code:', e);
          throw e; // Re-throw to be caught by the outer useEffect try/catch
        }
      `,
      );

      // --- Step 3: Set up the execution environment and run the factory ---
      const R = React;
      // Basic mock require function. Currently only supports 'react'.
      // LIMITATION: Any other module imports will fail or return empty objects.
      // A more robust solution requires a full bundler or more complex module proxying,
      // typically done within a sandboxed environment.
      const mockRequire = (name: string) => {
        if (name === 'react') {
          // Return the React object injected into the new Function scope
          return R;
        }
        console.warn(
          `Preview component tried to require: '${name}'. Only 'react' is supported. Returning an empty object.`,
        );
        return {}; // Return an empty object for unsupported modules to prevent immediate crashes
      };
      const exportsObj: { default?: any } = {}; // Object to capture exports from the evaluated code
      const moduleObj = { exports: exportsObj }; // Mock module object for CommonJS compatibility

      // Execute the factory function with the mocked environment
      componentFactory(R, mockRequire, exportsObj, moduleObj);

      // --- Step 4: Identify the component or element to render from exports ---
      // Look for a default export first, then fallback to general module.exports
      const CompCandidate = moduleObj.exports.default || moduleObj.exports;

      // Check if the export is a React component (function or class)
      if (
        typeof CompCandidate === 'function' || // Function component
        (CompCandidate &&
          typeof CompCandidate === 'object' &&
          typeof (CompCandidate as any).render === 'function') // Class component instance check (less common export but possible)
        // Note: Checking `CompCandidate.prototype.isReactComponent` is the standard for classes,
        // but the function check covers functional components. The current check is okay but not exhaustive.
      ) {
        // It's a React component class or function.
        // We cast it to React.ElementType. The rendering logic will handle passing props.
        setComponentToRender(CompCandidate as React.ElementType);
      }
      // Check if the export is a valid React element (e.g., <div>)
      else if (React.isValidElement(CompCandidate)) {
        // It's a React element. Wrap it in a component for rendering, cloning to pass props.
        // This wrapper assumes the original element can receive props, particularly 'markdown'.
        const ElementWrapper: ComponentType<{ markdown: string }> = ({ markdown }) =>
          React.cloneElement(CompCandidate as ReactElement<{ markdown?: string }>, {
            markdown, // Pass the code prop as 'markdown' to the cloned element
          });
        // Set the wrapper component as the thing to render
        setComponentToRender(ElementWrapper);
      }
      // If neither a component nor a valid element was exported/resulted
      else {
        console.error(
          'Preview: Transpiled code did not export a usable React component, function, or element.',
          'Exported value:',
          CompCandidate,
          'Full exports:',
          moduleObj.exports,
        );
        throw new Error(
          'Could not render preview: The code did not export a recognizable React component (function or class) or a valid React element.',
        );
      }
    } catch (e: unknown) {
      // Catch errors during Babel transpilation or `new Function` evaluation/execution
      console.error('Error during preview transpilation or evaluation:', e);

      // Store the error for rendering the error state
      setEvaluationError(e);

      // Log the transpiled code if evaluation failed, for debugging
      if (transpiledCode) {
        console.log('Transpiled code (for debug):\n', transpiledCode);
      }
    }
  }, [code, uniqueId]); // Depend on 'code' to re-run when the previewed code changes. useId is stable.

  // Function to render errors (transpilation, evaluation, or rendering caught by ErrorBoundary)
  const renderErrorState = (caughtError: unknown): ReactNode => {
    // Use the custom onErrorRender prop if provided by the user
    // This allows the consumer of ReactPreviewRenderer to control the error UI
    if (onErrorRender) {
      // Pass the original caught error value to the custom renderer
      return onErrorRender(caughtError);
    }

    // Default error rendering UI
    let message = 'An unknown error occurred.';
    let stack = null;

    if (caughtError instanceof Error) {
      message = caughtError.message;
      stack = caughtError.stack;
      // Check if it's likely a transpilation error based on message
      if (message.includes('Babel')) {
        message = `Transpilation Error: ${message}`;
      } else {
        message = `Execution Error: ${message}`;
      }
    } else if (typeof caughtError === 'string') {
      message = caughtError;
    } else {
      // Attempt to stringify other types of errors
      try {
        message = `Unknown Error Type: ${JSON.stringify(caughtError)}`;
      } catch (err) {
        message = 'An unstringifiable unknown error occurred.';
      }
    }

    return (
      <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/40 rounded border border-red-300 dark:border-red-600">
        <strong className="font-semibold">Component Preview Error:</strong>
        <pre className="mt-1 text-xs whitespace-pre-wrap">{message}</pre>
        {/* Display stack trace only for Error instances */}
        {caughtError instanceof Error && stack && (
          <pre className="mt-2 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap break-all">
            {stack}
          </pre>
        )}
        {/* Display transpiled code for debugging if available */}
        {transpiledCodeForDebug && (
          <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-600">
            <strong className="font-semibold">Transpiled Code (for debug):</strong>
            <pre className="mt-1 text-xs whitespace-pre-wrap break-all bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {transpiledCodeForDebug}
            </pre>
          </div>
        )}
        {/* Hint to check console if no detailed info is shown */}
        {!(caughtError instanceof Error && stack) && !transpiledCodeForDebug && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Check the browser console for more details.
          </p>
        )}
      </div>
    );
  };

  // --- Render Logic ---

  // If there was an error during transpilation or evaluation (handled in useEffect)
  if (evaluationError) {
    // Call renderErrorState with the caught evaluation error
    return renderErrorState(evaluationError);
  }

  // If still loading (ComponentToRender is null)
  if (!ComponentToRender) {
    // Use custom loading render if provided
    if (onLoadingRender) {
      return onLoadingRender();
    }
    // Default loading state UI
    return (
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400 animate-pulse">
        Loading preview...
      </div>
    );
  }

  // If a component or element wrapper is ready, render it inside the Error Boundary
  // The Error Boundary catches errors that happen *during* React's rendering phase of the previewed code.
  return (
    // Pass renderErrorState to the Error Boundary's onErrorRender prop.
    // This ensures a consistent error UI for both evaluation and rendering errors.
    <PreviewErrorBoundary onErrorRender={renderErrorState}>
      <div className="p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-black dark:text-white min-h-[50px] overflow-auto">
        {/* Render the component or element wrapper.
            We pass the original 'code' as a 'markdown' prop.
            This assumes the previewed component/element expects this prop,
            especially if it was wrapped because it was originally an element. */}
        <ComponentToRender markdown={code} />
      </div>
    </PreviewErrorBoundary>
  );
};
