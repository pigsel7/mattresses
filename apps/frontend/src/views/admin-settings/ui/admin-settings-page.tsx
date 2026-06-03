"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Checkbox, Input } from "@mattress/ui";
import type { AdminSettingDto } from "@mattress/shared";
import { getAdminSettings, updateAdminSetting } from "@/shared/api/admin-settings";
import { useToast } from "@/shared/ui/toast-provider";

type SettingDraft = {
  isPublic: boolean;
  label: string;
  value: string;
};

const settingTitles: Record<string, string> = {
  contact_phone: "Контактный телефон",
  owner_email: "Email для получения заказов",
  shop_address: "Город и адрес магазина"
};

export function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<AdminSettingDto[]>([]);
  const [drafts, setDrafts] = useState<Record<string, SettingDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const loadedSettings = await getAdminSettings();

        if (cancelled) {
          return;
        }

        setSettings(loadedSettings);
        setDrafts(
          Object.fromEntries(
            loadedSettings.map((setting) => [
              setting.key,
              {
                isPublic: setting.isPublic,
                label: setting.label ?? "",
                value: setting.value
              }
            ])
          )
        );
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить настройки.");
          toast.error("Не удалось загрузить настройки.");
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  function updateDraft(key: string, patch: Partial<SettingDraft>) {
    setDrafts((current) => ({
      ...current,
      [key]: {
        isPublic: current[key]?.isPublic ?? false,
        label: current[key]?.label ?? "",
        value: current[key]?.value ?? "",
        ...current[key],
        ...patch
      }
    }));
  }

  async function handleSave(key: string, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const draft = drafts[key];

    if (!draft) {
      return;
    }

    setSavingKey(key);
    setError(null);

    try {
      const updated = await updateAdminSetting(key, {
        isPublic: draft.isPublic,
        label: draft.label.trim() || undefined,
        value: draft.value
      });

      setSettings((current) =>
        current.map((setting) => (setting.key === key ? updated : setting))
      );
      toast.success(`${settingTitles[key] ?? "Настройка"} сохранена`);
    } catch {
      const message = `Не удалось сохранить настройку: ${settingTitles[key] ?? key}.`;
      setError(message);
      toast.error(message);
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="page-stack admin-settings-page">
      <div className="admin-settings-page__top">
        <div>
          <h1 className="section-title">Настройки</h1>
          <p className="admin-settings-page__description">
            Телефон, email владельца и другие параметры магазина.
          </p>
        </div>
        <Link className="admin-settings-page__back-link" href="/admin">
          Назад
        </Link>
      </div>

      {error ? <div className="form-error">{error}</div> : null}

      <div className="admin-settings-page__list">
        {settings.map((setting) => {
          const draft = drafts[setting.key];

          if (!draft) {
            return null;
          }

          return (
            <Card key={setting.key} className="admin-setting-row">
              <form className="admin-setting-row__body" onSubmit={(event) => void handleSave(setting.key, event)}>
                <div className="admin-setting-row__top">
                  <div>
                    <h2 className="admin-setting-row__title">
                      {settingTitles[setting.key] ?? setting.label ?? setting.key}
                    </h2>
                  </div>
                  <Badge>{setting.isPublic ? "Публично" : "Скрыто"}</Badge>
                </div>
                <div className="admin-setting-row__grid">
                  <label>
                    <span>Название в админке</span>
                    <Input
                      fullWidth
                      onChange={(event) => updateDraft(setting.key, { label: event.target.value })}
                      value={draft.label}
                    />
                  </label>
                  <label>
                    <span>Значение</span>
                    <Input
                      fullWidth
                      onChange={(event) => updateDraft(setting.key, { value: event.target.value })}
                      value={draft.value}
                    />
                  </label>
                </div>
                <div className="admin-setting-row__actions">
                  <Checkbox
                    checked={draft.isPublic}
                    label="Публичная"
                    onChange={(event) =>
                      updateDraft(setting.key, { isPublic: event.target.checked })
                    }
                  />
                  <Button loading={savingKey === setting.key} type="submit">
                    Сохранить
                  </Button>
                </div>
              </form>
            </Card>
          );
        })}

        {settings.length === 0 ? <div className="empty-state">Настроек пока нет.</div> : null}
      </div>
    </div>
  );
}
