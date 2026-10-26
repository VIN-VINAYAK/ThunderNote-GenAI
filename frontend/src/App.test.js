import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/react';
import { TextDecoder } from 'util';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import axios from 'axios';
import { store } from './redux/store';
import NoteCard from './components/Notes/NoteCard/NoteCard';
import Chatbot from './Chatbot';
import AllRoutes from './routes/AllRoutes';
import Notespage from './pages/Notespage';
import Navbar from './components/Home/Navbar/Navbar';
import { ThemeProvider } from './ThemeContext';
import { getAiErrorMessage } from './constants/config';
import { GET_NOTES_SUCCESS } from './redux/notes/note_types';
import { LOGIN_USER_SUCCESS, LOGOUT } from './redux/users/user_types';

jest.mock('axios');
jest.mock('./components/3D/AnimatedBackground', () => ({
  Scene3DFull: () => null,
}));

const testNote = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test note',
  body: 'A note body',
  user: 'test-user',
};

function signInForTest() {
  store.dispatch({
    type: LOGIN_USER_SUCCESS,
    payload: { user: 'test-user', token: 'test-token' },
  });
}

beforeEach(() => {
  store.dispatch({ type: LOGOUT });
  store.dispatch({ type: GET_NOTES_SUCCESS, payload: [] });
  localStorage.removeItem('theme');
  axios.mockReset();
});

test('loads the Thunder Notes homepage through its route', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AllRoutes />
    </MemoryRouter>
  );

  expect(await screen.findByText(/make space for/i)).toBeInTheDocument();
});

test('opens note actions without rendering invalid menu elements', async () => {
  render(
    <Provider store={store}>
      <ChakraProvider>
        <NoteCard _id="note-1" title="Test note" body="A note body" />
      </ChakraProvider>
    </Provider>
  );

  await userEvent.click(await screen.findByRole('button', { name: /note actions/i }));

  expect(await screen.findByText('Edit Note')).toBeInTheDocument();
  expect(screen.getByText('Delete')).toBeInTheDocument();
});

test('edits a note and refreshes the notes list', async () => {
  signInForTest();
  let notes = [testNote];
  axios.mockImplementation(async (_url, options) => {
    if (options.method === 'patch') {
      notes = [{ ...notes[0], ...options.data }];
      return { data: { status: 1 } };
    }
    return { data: { status: 1, data: notes } };
  });
  store.dispatch({ type: GET_NOTES_SUCCESS, payload: notes });

  render(
    <Provider store={store}>
      <ChakraProvider>
        <NoteCard {...testNote} />
      </ChakraProvider>
    </Provider>
  );

  await userEvent.click(screen.getByRole('button', { name: /note actions/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /edit note/i }));
  const titleInput = await screen.findByPlaceholderText('Note title...');
  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, 'Updated title');
  await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

  await waitFor(() => expect(store.getState().noteReducer.data[0].title).toBe('Updated title'));
  expect(axios).toHaveBeenCalledWith(
    expect.stringMatching(/\/note\/$/),
    expect.objectContaining({ method: 'patch' })
  );
});

test('deletes a note and refreshes the notes list', async () => {
  signInForTest();
  let notes = [testNote];
  axios.mockImplementation(async (_url, options) => {
    if (options.method === 'delete') {
      notes = [];
      return { data: { status: 1 } };
    }
    return { data: { status: 1, data: notes } };
  });
  store.dispatch({ type: GET_NOTES_SUCCESS, payload: notes });
  render(
    <Provider store={store}>
      <ChakraProvider>
        <NoteCard {...testNote} />
      </ChakraProvider>
    </Provider>
  );

  await userEvent.click(screen.getByRole('button', { name: /note actions/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete/i }));
  expect(await screen.findByText('Are you sure? This action cannot be undone.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(store.getState().noteReducer.data).toEqual([]));
  expect(axios).toHaveBeenCalledWith(
    expect.stringMatching(/\/note\/$/),
    expect.objectContaining({ method: 'delete' })
  );
});

test('edits notes from the dashboard and closes the editor', async () => {
  signInForTest();
  let notes = [testNote];
  axios.mockImplementation(async (_url, options = {}) => {
    if (options.method === 'patch') {
      notes = [{ ...notes[0], ...options.data }];
    }
    if (options.method === 'delete') {
      notes = [];
    }
    return { data: { status: 1, data: notes } };
  });

  render(
    <Provider store={store}>
      <ChakraProvider>
        <Notespage />
      </ChakraProvider>
    </Provider>
  );

  await screen.findByText('Test note');
  await userEvent.click(await screen.findByRole('button', { name: /note actions/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /edit note/i }));
  const titleInput = await screen.findByPlaceholderText('Note title...');
  await userEvent.clear(titleInput);
  await userEvent.type(titleInput, 'Dashboard edit');
  await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
  await waitFor(() => expect(store.getState().noteReducer.data[0].title).toBe('Dashboard edit'));
  await waitFor(() => expect(screen.getByPlaceholderText('Note title...')).not.toBeVisible());
});

test('deletes notes from the dashboard', async () => {
  signInForTest();
  let notes = [testNote];
  axios.mockImplementation(async (_url, options = {}) => {
    if (options.method === 'delete') {
      notes = [];
    }
    return { data: { status: 1, data: notes } };
  });

  render(
    <Provider store={store}>
      <ChakraProvider>
        <Notespage />
      </ChakraProvider>
    </Provider>
  );

  await screen.findByText('Test note');
  await userEvent.click(await screen.findByRole('button', { name: /note actions/i }));
  await userEvent.click(await screen.findByRole('menuitem', { name: /delete/i }));
  await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
  await waitFor(() => expect(store.getState().noteReducer.data).toEqual([]));
  expect(await screen.findByText('Your first note starts here.')).toBeInTheDocument();
});

test('refreshes notes after an AI response that may create a note', async () => {
  signInForTest();
  const originalFetch = global.fetch;
  const originalTextDecoder = global.TextDecoder;
  const notesChanged = jest.fn();
  const chunks = [
    new Uint8Array(Buffer.from('data: {"token":"Note created"}\n\ndata: [DONE]\n\n')),
  ];
  global.fetch = jest.fn(async (_url, options) => {
    if (options.method !== 'POST') {
      return { ok: true, json: async () => ({ messages: [] }) };
    }
    return {
      ok: true,
      body: {
        getReader: () => ({
          read: async () => chunks.length
            ? { value: chunks.shift(), done: false }
            : { value: undefined, done: true },
        }),
      },
    };
  });
  global.TextDecoder = TextDecoder;
  window.addEventListener('thunder-notes-changed', notesChanged);

  try {
    render(
      <Provider store={store}>
        <ChakraProvider>
          <Chatbot open onClose={() => {}} />
        </ChakraProvider>
      </Provider>
    );
    await userEvent.type(screen.getByRole('textbox', { name: /chat message/i }), 'Create a note');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(notesChanged).toHaveBeenCalled());
  } finally {
    window.removeEventListener('thunder-notes-changed', notesChanged);
    global.fetch = originalFetch;
    global.TextDecoder = originalTextDecoder;
  }
});

test('shows a helpful message when the backend cannot be reached', () => {
  expect(getAiErrorMessage(new TypeError('Failed to fetch'), 'AI action failed')).toMatch(/backend/i);
});

test('offers only the white sky-and-crimson and dark themes', async () => {
  localStorage.setItem('theme', 'skyblue');
  render(
    <MemoryRouter>
      <Provider store={store}>
        <ChakraProvider>
          <ThemeProvider>
            <Navbar />
          </ThemeProvider>
        </ChakraProvider>
      </Provider>
    </MemoryRouter>
  );

  const selector = screen.getByRole('combobox', { name: /color theme/i });
  expect(Array.from(selector.options).map((option) => option.textContent)).toEqual([
    'White · Sky & Crimson',
    'Dark',
  ]);
  expect(selector).toHaveValue('light');

  fireEvent.change(selector, { target: { value: 'dark' } });
  await waitFor(() => {
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
