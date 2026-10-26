import { 
  Button, 
  Card, 
  CardBody, 
  Heading, 
  Text, 
  Flex, 
  HStack, 
  CardHeader, 
  CardFooter,
  Input,
  Textarea,
  useDisclosure,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuDivider,
  Tooltip,
  Wrap,
  WrapItem,
  Tag,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { store } from "../../../redux/store";
import { BASE_URL, getAiErrorMessage } from "../../../constants/config";
import { deleteNotes, updateNotes } from "../../../redux/notes/note_actions";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { 
  EditIcon, 
  DeleteIcon, 
  HamburgerIcon, 
  ExternalLinkIcon,
  CopyIcon,
  StarIcon,
} from "@chakra-ui/icons";

const gradients = [
  "var(--note-gradient-one)",
  "var(--note-gradient-two)",
  "var(--note-gradient-three)",
  "var(--note-gradient-four)",
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      delay: i * 0.04,
      ease: "easeOut",
    },
  }),
  hover: { y: -4, transition: { duration: 0.18, ease: "easeOut" } },
  tap: { scale: 0.99 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2 } },
};

export default function NoteCard({ title, body, user, _id, createdAt, updatedAt, summary, tags = [], index = 0 }) {
  const dispatch = useDispatch();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteDialogOpen,
    onOpen: openDeleteDialog,
    onClose: closeDeleteDialog,
  } = useDisclosure();
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const cancelDeleteRef = useRef(null);
  const [tempTitle, setTitle] = useState(title);
  const [tempBody, setBody] = useState(body);
  const [isEditing, setIsEditing] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [actionError, setActionError] = useState("");
  const cardRef = useRef(null);
  
  const gradient = gradients[_id ? parseInt(_id.slice(-1), 16) % gradients.length : index % gradients.length];
  const borderColor = "var(--line)";

  const runAiAction = async (action) => {
    if (!tempBody.trim() || aiBusy) return;
    setAiBusy(true);
    try {
      const token = store.getState().userReducer.token;
      const response = await fetch(`${BASE_URL}/api/ai/transform`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token }, body: JSON.stringify({ action, title: tempTitle, text: tempBody }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "AI action failed");
      setBody(result.result || tempBody);
    } catch (error) { window.alert(getAiErrorMessage(error, "AI action failed")); }
    finally { setAiBusy(false); }
  };

  const updateNote = async () => {
    setActionError("");
    const result = await dispatch(updateNotes(_id, { title: tempTitle, body: tempBody }));
    if (!result?.success) {
      setActionError(result?.message || "Unable to update the note. Please try again.");
      return;
    }
    onClose();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteNotes(_id));
    closeDeleteDialog();
    if (!result?.success) {
      window.alert(result?.message || "Unable to delete the note. Please try again.");
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${title}

${body}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.article
      ref={cardRef}
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      exit="exit"
      layout
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
    >
      <Card
        className="card-3d"
        align="center"
        size="md"
        style={{
          background: gradient,
          border: `1px solid ${borderColor}`,
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          transformStyle: 'preserve-3d',
          minHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <CardHeader
          height="auto"
          alignItems="flex-start"
          justifyContent="space-between"
          style={{
            padding: '20px 20px 12px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <motion.div
            variants={contentVariants}
            style={{ flex: 1 }}
          >
            <Heading 
              size="lg" 
              noOfLines={1} 
              style={{ 
                color: 'var(--paper)', 
                fontWeight: 800, 
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                marginBottom: '4px',
              }}
            >
              {title}
            </Heading>
            <Text 
              noOfLines={1} 
              fontSize="sm" 
              style={{               color: 'var(--muted)' }}
            >
              {createdAt && `Created ${formatDate(createdAt)}`}{' '}
              {updatedAt && createdAt && '·'}{' '}
              {updatedAt && `Updated ${formatDate(updatedAt)}`}
            </Text>
          </motion.div>

          {/* ACTIONS MENU */}
          <motion.div
            variants={contentVariants}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Tooltip label="Favorite">
              <motion.button
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsFavorite(!isFavorite)}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--surface-soft) 78%, transparent)',
                  border: 'none',
                  cursor: 'pointer',
                  color: isFavorite ? 'var(--danger)' : 'var(--paper)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <StarIcon size={18} />
              </motion.button>
            </Tooltip>

            <Tooltip label="Copy">
              <motion.button
                whileHover="hover"
                whileTap="tap"
                onClick={handleCopy}
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--surface-soft) 78%, transparent)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--paper)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <CopyIcon size={18} />
              </motion.button>
            </Tooltip>

            <Menu>
              <MenuButton
                as={motion.button}
                aria-label="Note actions"
                whileHover="hover"
                whileTap="tap"
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'color-mix(in srgb, var(--surface-soft) 78%, transparent)',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--paper)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <HamburgerIcon size={18} />
              </MenuButton>

              <MenuList
                style={{
                  borderRadius: '12px',
                  background: 'var(--surface)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow)',
                  overflow: 'hidden',
                  minWidth: '160px',
                }}
              >
                <MenuItem
                  as={motion.button}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  onClick={() => {
                    setTitle(title);
                    setBody(body);
                    setActionError("");
                    setIsEditing(true);
                    onOpen();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    color: 'var(--paper)',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    fontSize: '0.9rem',
                  }}
                >
                  <EditIcon size={18} color="var(--sage)" />
                  Edit Note
                </MenuItem>

                <MenuDivider style={{ borderColor: 'var(--line)', mx: 3 }} />

                <MenuItem
                  as={motion.button}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={openDeleteDialog}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    fontSize: '0.9rem',
                  }}
                >
                  <DeleteIcon size={18} color="var(--danger)" />
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </motion.div>
        </CardHeader>

        {/* BODY */}
        <CardBody 
          mt={0}
          style={{ 
            flex: 1, 
            padding: '0 20px 16px', 
            position: 'relative', 
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <motion.div
            variants={contentVariants}
            style={{ flex: 1, overflow: 'hidden' }}
          >
            <Text 
              noOfLines={6} 
              style={{ 
                color: 'var(--paper)', 
                lineHeight: 1.7, 
                fontSize: '0.95rem',
                fontWeight: 400,
              }}
            >
              {body}
            </Text>
            {summary && <Text mt={2} noOfLines={2} fontSize="xs" color="var(--muted)">{summary}</Text>}
            {!!tags.length && <Wrap mt={2} spacing={1}>{tags.map((tag) => <WrapItem key={tag}><Tag size="sm" variant="subtle" colorScheme="green">{tag}</Tag></WrapItem>)}</Wrap>}
          </motion.div>
        </CardBody>

        {/* FOOTER */}
        <CardFooter 
          height="auto" 
          style={{ 
            padding: '12px 20px 20px', 
            position: 'relative', 
            zIndex: 2,
            borderTop: `1px solid ${borderColor}`,
            marginTop: 'auto',
          }}
        >
          <HStack width="100%" justifyContent="space-between" alignItems="center">
            <motion.div
              variants={contentVariants}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
            >
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 600, 
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                {user || 'Unknown'}
              </span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--sage)',
                }}
              />
              <span style={{ 
                fontSize: '0.7rem', 
                color: 'var(--faint)',
              }}>
                Saved
              </span>
            </motion.div>

            <motion.div
              variants={contentVariants}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Tooltip label="Open Note">
                <motion.button
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => { onOpen(); setIsEditing(true); }}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'color-mix(in srgb, var(--surface-soft) 78%, transparent)',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--paper)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <ExternalLinkIcon size={18} />
                </motion.button>
              </Tooltip>
            </motion.div>
          </HStack>
        </CardFooter>

        {/* EDIT MODAL */}
        {isOpen && (
          <Modal
            initialFocusRef={initialRef}
            finalFocusRef={finalRef}
            isOpen={isOpen}
            onClose={() => { onClose(); setIsEditing(false); }}
            style={{ zIndex: 10000 }}
          >
              <ModalOverlay
                bg="color-mix(in srgb, var(--ink) 78%, transparent)"
                style={{ backdropFilter: 'blur(5px)' }}
              />
              <ModalContent
                style={{
                  maxWidth: '600px',
                  borderRadius: '24px',
                  background: 'var(--surface)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--line)',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <ModalHeader style={{ color: 'var(--paper)', borderBottom: '1px solid var(--line)', px: 6, py: 4 }}>
                  <Flex justifyContent="space-between" alignItems="center" width="100%">
                    <Heading size="lg" style={{ fontWeight: 700 }}>
                      {isEditing ? "Edit Note" : "View Note"}
                    </Heading>
                    <ModalCloseButton color="var(--paper)" />
                  </Flex>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6} style={{ px: 6, pt: 4 }}>
                  {actionError && <Text role="alert" color="red.300" mb={3}>{actionError}</Text>}
                  <Input
                    value={tempTitle}
                    placeholder="Note title..."
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      background: 'var(--input-surface)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      color: 'var(--paper)',
                      '&::placeholder': { color: 'var(--faint)' },
                      '&:focus': { borderColor: 'var(--sage)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--sage) 20%, transparent)' },
                    }}
                  ></Input>

                  <Textarea
                    mt={4}
                    value={tempBody}
                    placeholder="Write your thoughts here..."
                    onChange={(e) => setBody(e.target.value)}
                    minHeight="200px"
                    style={{
                      background: 'var(--input-surface)',
                      border: '1px solid var(--line)',
                      borderRadius: '12px',
                      color: 'var(--paper)',
                      '&::placeholder': { color: 'var(--faint)' },
                      '&:focus': { borderColor: 'var(--sage)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--sage) 20%, transparent)' },
                      resize: 'vertical',
                    }}
                  ></Textarea>
                  <Text mt={4} mb={2} color="var(--muted)" fontSize="sm" fontWeight="600">AI writing tools</Text>
                  <Wrap spacing={2}>
                    {[ ["summarize", "Summarize"], ["expand", "Expand"], ["reformat", "Reformat"], ["grammar", "Fix grammar"], ["rewrite", "Rewrite"], ["translate", "Translate"], ["actions", "Action items"] ].map(([action, label]) => <WrapItem key={action}><Button size="xs" variant="outline" color="var(--paper)" isLoading={aiBusy} isDisabled={aiBusy || !tempBody.trim()} onClick={() => runAiAction(action)}>{label}</Button></WrapItem>)}
                  </Wrap>
                </ModalBody>

                <ModalFooter style={{ px: 6, pb: 4, borderTop: '1px solid var(--line)' }}>
                  <Button 
                    colorScheme="blue" 
                    mr={3} 
                    onClick={updateNote}
                    style={{
                      borderRadius: '12px',
                      fontWeight: 600,
                      padding: '12px 28px',
                    }}
                  >
                    {isEditing ? "Save Changes" : "Close"}
                  </Button>
                  <Button 
                    onClick={() => { onClose(); setIsEditing(false); }}
                    variant="ghost"
                    color="var(--paper)"
                    style={{
                      borderRadius: '12px',
                      fontWeight: 600,
                      padding: '12px 28px',
                    }}
                  >
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
          </Modal>
        )}
      </Card>
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete note
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </motion.article>
  );
}
